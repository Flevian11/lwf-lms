<?php

namespace App\Http\Controllers;

use App\Models\Assignment;
use App\Models\AssignmentAllocation;
use App\Models\AssignmentSubmission;
use App\Models\Course;
use App\Models\User;
use App\Notifications\AssignmentAllocatedNotification;
use App\Services\AssignmentGradingService;
use App\Services\AuditLogService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class AdminAssignmentController extends Controller
{
    public function index(Request $request): Response
    {
        $search=trim((string)$request->query('search','')); $status=(string)$request->query('status','all'); $courseId=$request->integer('course_id')?:null; $selected=$request->integer('assignment_id')?:null;
        $q=Assignment::query()->with('course:id,title')->withCount(['allocations','submissions'])->latest('updated_at');
        if($search!=='') $q->where(fn($x)=>$x->where('title','like',"%{$search}%")->orWhere('slug','like',"%{$search}%"));
        if(in_array($status,['draft','published','closed'],true)) $q->where('status',$status);
        if($courseId) $q->where('course_id',$courseId);
        $assignments=$q->paginate(10)->withQueryString()->through(fn(Assignment $a)=>$this->assignmentPayload($a));
        $selectedAssignment=$selected ? Assignment::with(['course:id,title','allocations.user:id,name,email,avatar_path'])->withCount('submissions')->find($selected) : null;
        $allocationCourseId = $selectedAssignment?->course_id ?: $courseId;
        $submissions=$selectedAssignment ? AssignmentSubmission::with(['user:id,name,email,avatar_path'])->where('assignment_id',$selectedAssignment->id)->latest('submitted_at')->paginate(10,['*'],'submission_page')->withQueryString()->through(fn(AssignmentSubmission $s)=>[
            'id'=>$s->id,'user'=>['id'=>$s->user->id,'name'=>$s->user->name,'email'=>$s->user->email,'avatar_path'=>$s->user->avatar_path], 'attempt_number'=>$s->attempt_number,'status'=>$s->status,'score'=>$s->score,'max_points'=>$selectedAssignment->max_points,'feedback'=>$s->feedback,'submitted_at'=>$s->submitted_at?->toISOString(),'graded_at'=>$s->graded_at?->toISOString(),'original_filename'=>$s->original_filename,'file_size'=>$s->file_size,'has_file'=>(bool)$s->file_path,
        ]) : null;
        return Inertia::render('Admin/Assignments',['admin'=>$this->adminPayload($request),'assignments'=>$assignments,'courses'=>Course::orderBy('title')->get(['id','title','slug']),'students'=>$allocationCourseId ? $this->eligibleStudents($allocationCourseId, $selectedAssignment?->id)->map(fn(User $u)=>$this->studentPayload($u))->values()->all() : [],'selectedAssignment'=>$selectedAssignment ? $this->assignmentDetail($selectedAssignment) : null,'submissions'=>$submissions,'filters'=>['search'=>$search,'status'=>$status,'course_id'=>$courseId,'assignment_id'=>$selected]]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data=$this->validateAssignment($request); $data['instructions'] = $data['instructions'] ?? ''; $data['created_by']=$request->user()->id; $data['slug']=$this->uniqueSlug($data['slug'] ?: $data['title'], null, $data['course_id']);
        $a=Assignment::create($data); $this->audit('assignment_created',$request,$a);
        return back()->with('success','Assignment created successfully.');
    }
    public function update(Request $request, Assignment $assignment): RedirectResponse
    { $data=$this->validateAssignment($request,$assignment); $data['slug']=$this->uniqueSlug($data['slug']?:$data['title'],$assignment->id,$data['course_id']); $assignment->update($data); $this->audit('assignment_updated',$request,$assignment); return back()->with('success','Assignment updated successfully.'); }
    public function destroy(Request $request, Assignment $assignment): RedirectResponse
    { if($assignment->submissions()->exists()) return back()->withErrors(['assignment'=>'This assignment has submissions and cannot be deleted. Close it instead.']); $id=$assignment->id; $course=$assignment->course_id; $assignment->delete(); $this->audit('assignment_deleted',$request,null,['assignment_id'=>$id,'course_id'=>$course]); return back()->with('success','Assignment deleted successfully.'); }

    public function allocate(Request $request, Assignment $assignment): RedirectResponse
    {
        $data=$request->validate(['user_ids'=>['required','array','min:1'],'user_ids.*'=>['integer','distinct','exists:users,id']]);
        $eligible=$this->eligibleStudents($assignment->course_id, $assignment->id)->whereIn('id',$data['user_ids'])->keyBy('id'); $created=[];
        DB::transaction(function() use($assignment,$eligible,$request,&$created){ foreach($eligible as $student){ $allocation=AssignmentAllocation::firstOrCreate(['assignment_id'=>$assignment->id,'user_id'=>$student->id],['assigned_by'=>$request->user()->id,'assigned_at'=>now()]); if($allocation->wasRecentlyCreated) $created[]=$student; }});
        foreach($created as $student){ $this->audit('assignment_allocated',$request,$assignment,['student_id'=>$student->id]); try { Notification::send($student->fresh(),new AssignmentAllocatedNotification($assignment->load('course'))); $this->audit('assignment_allocation_email_sent',$request,$assignment,['student_id'=>$student->id,'recipient'=>$student->email]); } catch(Throwable $e){ $this->audit('assignment_allocation_email_failed',$request,$assignment,['student_id'=>$student->id,'recipient'=>$student->email,'error'=>$e->getMessage()]); }}
        return back()->with('success',count($created).' student(s) allocated successfully.');
    }

    public function grade(Request $request, AssignmentSubmission $submission, AssignmentGradingService $grading): RedirectResponse
    {
        if ($submission->score !== null || $submission->status === 'graded') {
            return back()->withErrors(['submission' => 'This submission has already been graded and cannot be graded again.']);
        }

        $data=$request->validate(['score'=>['required','integer','min:0'],'feedback'=>['nullable','string','max:10000']]);
        $updated=$grading->grade($submission,$data['score'],$data['feedback']??null,$request->user()->id);
        $this->audit('assignment_submission_graded',$request,$updated->assignment,['submission_id'=>$updated->id,'student_id'=>$updated->user_id,'score'=>$updated->score]);
        return back()->with('success','Submission graded successfully.');
    }
    public function download(Request $request, AssignmentSubmission $submission)
    { $submission->load('assignment'); abort_unless($submission->file_path && Storage::disk('local')->exists($submission->file_path),404); $this->audit('assignment_submission_downloaded',$request,$submission->assignment,['submission_id'=>$submission->id,'student_id'=>$submission->user_id]); return Storage::disk('local')->download($submission->file_path,$submission->original_filename ?: basename($submission->file_path)); }

    private function eligibleStudents(int $courseId, ?int $assignmentId = null){
        return User::query()
            ->whereDoesntHave('roles', fn($q) => $q->where('name','Admin')->where('guard_name','web'))
            ->whereHas('courseEnrollments', fn($q) => $q->where('course_id',$courseId)->whereIn('status',['active','completed'])->whereNotNull('access_granted_at'))
            ->when($assignmentId, function($q) use ($assignmentId) {
                // Do not rely on optional User model relationships here. Eligibility is enforced
                // directly against the allocation/submission tables so this remains valid even
                // when those inverse relationships are not declared on User.
                $q->whereNotExists(function($sub) use ($assignmentId) {
                    $sub->selectRaw('1')
                        ->from('assignment_allocations')
                        ->whereColumn('assignment_allocations.user_id', 'users.id')
                        ->where('assignment_allocations.assignment_id', $assignmentId);
                })->whereNotExists(function($sub) use ($assignmentId) {
                    $sub->selectRaw('1')
                        ->from('assignment_submissions')
                        ->whereColumn('assignment_submissions.user_id', 'users.id')
                        ->where('assignment_submissions.assignment_id', $assignmentId);
                });
            })
            ->orderBy('name')
            ->get(['id','name','email','avatar_path']);
    }
    private function validateAssignment(Request $request,?Assignment $assignment=null):array { return $request->validate(['course_id'=>['required','integer','exists:courses,id'],'module_id'=>['nullable','integer','exists:course_modules,id'],'lesson_id'=>['nullable','integer','exists:lessons,id'],'title'=>['required','string','max:200'],'slug'=>['nullable','string','max:220','regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/',Rule::unique('assignments','slug')->ignore($assignment?->id)],'instructions'=>['required','string'],'max_points'=>['required','integer','min:1','max:10000'],'available_from'=>['nullable','date'],'due_at'=>['nullable','date','after_or_equal:available_from'],'submission_type'=>['required',Rule::in(['text','file','text_and_file'])],'max_file_size_mb'=>['nullable','integer','min:1','max:100'],'allowed_file_types'=>['nullable','array'],'status'=>['required',Rule::in(['draft','published','closed'])]]); }
    private function uniqueSlug(string $base,?int $ignore=null, ?int $courseId=null):string { $slug=\Illuminate\Support\Str::slug($base); $candidate=$slug; $i=2; while(Assignment::where('course_id',$courseId)->where('slug',$candidate)->when($ignore,fn($q)=>$q->where('id', '<>', $ignore))->exists()){ $candidate=$slug.'-'.$i++; } return $candidate; }
    private function assignmentPayload(Assignment $a):array { return ['id'=>$a->id,'title'=>$a->title,'slug'=>$a->slug,'course'=>$a->course?->title,'course_id'=>$a->course_id,'instructions'=>$a->instructions,'max_points'=>$a->max_points,'available_from'=>$a->available_from?->toISOString(),'due_at'=>$a->due_at?->toISOString(),'submission_type'=>$a->submission_type,'max_file_size_mb'=>$a->max_file_size_mb,'allowed_file_types'=>$a->allowed_file_types??[],'status'=>$a->status,'allocations_count'=>$a->allocations_count,'submissions_count'=>$a->submissions_count,'updated_at'=>$a->updated_at?->toISOString()]; }
    private function assignmentDetail(Assignment $a):array { return $this->assignmentPayload($a)+['allocations'=>$a->allocations->map(fn($x)=>['id'=>$x->id,'user'=>$this->studentPayload($x->user),'assigned_at'=>$x->assigned_at?->toISOString()])->values()->all()]; }
    private function studentPayload(User $u):array { return ['id'=>$u->id,'name'=>$u->name,'email'=>$u->email,'avatar_path'=>$u->avatar_path]; }
    private function adminPayload(Request $r):array { $u=$r->user(); return ['id'=>$u->id,'name'=>$u->name,'email'=>$u->email,'avatar_path'=>$u->avatar_path,'email_two_factor_enabled'=>(bool)$u->email_two_factor_enabled]; }
    private function audit(string $event,Request $request,$resource=null,array $meta=[]):void { app(AuditLogService::class)->userEvent($event,$request,['resource_type'=>$resource?class_basename($resource):'assignment','resource_id'=>$resource?->id,'metadata'=>$meta]); }
}
