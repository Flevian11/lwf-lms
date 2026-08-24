<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>Learn With Flevian Administrative Report</title>
<style>
@page{margin:28px 30px}*{box-sizing:border-box}body{font-family:DejaVu Sans,sans-serif;color:#13203a;font-size:8.5px;line-height:1.45}h1,h2,h3,p{margin:0}.header{padding-bottom:15px;border-bottom:2px solid #1554c0}.eyebrow{font-size:7px;letter-spacing:2px;text-transform:uppercase;color:#1554c0;font-weight:700}.title{font-size:22px;font-weight:800;margin-top:5px}.muted{color:#66758d}.period{float:right;margin-top:-21px;font-size:8px;text-align:right}.section{margin-top:16px}.section-title{font-size:12px;font-weight:800;margin-bottom:8px}.grid{width:100%;border-collapse:separate;border-spacing:5px}.card{border:1px solid #dfe6f0;border-radius:8px;padding:9px;vertical-align:top}.label{font-size:6.5px;text-transform:uppercase;letter-spacing:1.1px;color:#7a879a;font-weight:700}.value{font-size:16px;font-weight:800;margin-top:3px}.small{font-size:7.5px;color:#66758d;margin-top:3px}.bar{height:6px;background:#edf1f6;border-radius:4px;overflow:hidden;margin-top:6px}.seg-green{height:100%;background:#20b486;float:left}.seg-blue{height:100%;background:#1554c0;float:left}.seg-amber{height:100%;background:#e7b33b;float:left}.row{border-bottom:1px solid #e8edf4;padding:6px 0}.row:last-child{border-bottom:0}.pill{display:inline-block;background:#edf4ff;color:#1554c0;border-radius:10px;padding:2px 6px;font-size:6.5px;font-weight:700}.rank{display:inline-block;width:15px;color:#7a879a;font-weight:800}.footer{margin-top:18px;padding-top:8px;border-top:1px solid #dfe6f0;color:#7a879a;font-size:6.5px}.score{font-size:10px;font-weight:800;color:#1554c0}.mutedline{color:#8a96a8;font-size:7px}.two{width:100%}.two td{width:50%;vertical-align:top;padding-right:5px}.nowrap{white-space:nowrap}
</style>
</head>
<body>
<div class="header"><div class="eyebrow">Learn With Flevian · Administration</div><div class="title">Academic insights report</div><div class="muted">Learning, assessment, recognition, finance, engagement and platform activity.</div><div class="period">Last {{ $days }} days<br>{{ $generatedAt->format('d M Y, H:i') }}</div></div>

<div class="section"><div class="section-title">Executive summary</div><table class="grid"><tr>
<td class="card"><div class="label">Learners</div><div class="value">{{ $learning['inventory']['students'] }}</div><div class="small">{{ $learning['inventory']['active_students'] }} active</div></td>
<td class="card"><div class="label">Enrollments</div><div class="value">{{ $learning['enrollments']['total'] }}</div><div class="small">{{ $learning['enrollments']['completed'] }} completed · {{ $learning['enrollments']['pending_access'] }} pending access</div></td>
<td class="card"><div class="label">Assignments</div><div class="value">{{ $learning['assignments']['total'] }}</div><div class="small">{{ $learning['assignments']['graded'] }} graded · {{ $learning['assignments']['pending'] }} pending</div></td>
<td class="card"><div class="label">Quiz attempts</div><div class="value">{{ $learning['quizzes']['attempts'] }}</div><div class="small">{{ $learning['quizzes']['passed'] }} passed</div></td>
<td class="card"><div class="label">Achievements</div><div class="value">{{ $learning['achievements']['awarded'] }}</div><div class="small">{{ $learning['achievements']['points'] }} points awarded</div></td>
</tr></table></div>

<div class="section"><div class="section-title">Course enrollment & completion</div>
<?php foreach ($learning['course_breakdown'] as $course) { ?>
<div class="row"><b>{{ $course['course'] }}</b><span class="pill" style="float:right">{{ $course['total'] }} enrolled</span><div class="small">{{ $course['completed'] }} completed · {{ $course['active_access'] }} active access · {{ $course['pending_access'] }} pending access · {{ $course['completion_percent'] }}% completion</div><div class="bar"><span class="seg-green" style="width:{{ $course['completion_percent'] }}%"></span><span class="seg-blue" style="width:{{ max(0, $course['access_percent'] - $course['completion_percent']) }}%"></span><span class="seg-amber" style="width:{{ max(0, 100 - $course['access_percent']) }}%"></span></div></div>
<?php } ?>
</div>

<div class="section"><div class="section-title">Recognition & learner performance</div><table class="two"><tr><td><div class="card"><div class="label">Achievement leaderboard</div>
<?php foreach ($learning['achievement_leaderboard'] as $index => $student) { ?>
<div class="row"><span class="rank">{{ $index + 1 }}</span><b>{{ $student['name'] }}</b><span style="float:right" class="score">{{ $student['points'] }} pts</span><div class="mutedline">{{ $student['awards'] }} achievement<?php echo $student['awards'] === 1 ? '' : 's'; ?></div></div>
<?php } ?>
<?php if (!count($learning['achievement_leaderboard'])) { ?><div class="small">No achievement awards recorded.</div><?php } ?>
</div></td><td><div class="card"><div class="label">Quiz performance</div>
<?php foreach ($learning['quiz_performance'] as $student) { ?>
<div class="row"><b>{{ $student['name'] }}</b><span style="float:right" class="score">{{ $student['average_percent'] }}%</span><div class="mutedline">{{ $student['attempts'] }} attempts · {{ $student['passed'] }} passed</div></div>
<?php } ?>
<?php if (!count($learning['quiz_performance'])) { ?><div class="small">No graded quiz attempts recorded.</div><?php } ?>
</div></td></tr></table></div>

<div class="section"><div class="section-title">Assignment performance</div><table class="grid"><tr>
<?php foreach ($learning['assignment_performance'] as $student) { ?>
<td class="card"><div class="label">Learner</div><div style="font-size:9px;font-weight:800;margin-top:3px">{{ $student['name'] }}</div><div class="score" style="margin-top:5px">{{ $student['average_percent'] }}%</div><div class="small">Average across {{ $student['graded'] }} graded submission<?php echo $student['graded'] === 1 ? '' : 's'; ?></div></td>
<?php } ?>
<?php if (!count($learning['assignment_performance'])) { ?><td class="card"><div class="small">No graded assignment submissions recorded.</div></td><?php } ?>
</tr></table></div>

<div class="section"><div class="section-title">Platform, engagement & finance</div><table class="grid"><tr>
<td class="card"><div class="label">Catalogue</div><div class="small">Courses <b>{{ $learning['inventory']['courses'] }}</b> · Published <b>{{ $learning['inventory']['published_courses'] }}</b></div><div class="small">Modules <b>{{ $learning['inventory']['modules'] }}</b> · Lessons <b>{{ $learning['inventory']['lessons'] }}</b></div><div class="small">Assignments <b>{{ $learning['inventory']['assignments'] }}</b> · Quizzes <b>{{ $learning['inventory']['quizzes'] }}</b></div></td>
<td class="card"><div class="label">Engagement</div><div class="value">{{ $learning['engagement']['average_lesson_progress'] }}%</div><div class="small">Average lesson progress · {{ $learning['engagement']['learning_activities'] }} learning activities</div></td>
<td class="card"><div class="label">Payments</div><div class="value">{{ $learning['finance']['successful_payments'] }}</div><div class="small">Successful · {{ $learning['finance']['currency'] }} {{ number_format($learning['finance']['successful_amount'], 2) }}</div></td>
</tr></table></div>

<div class="section"><div class="section-title">Traffic overview</div><table class="grid"><tr>
<td class="card"><div class="label">Page views</div><div class="value">{{ number_format($audit['summary']['total_page_views']) }}</div><div class="small">Authenticated {{ $audit['summary']['authenticated_page_views'] }} · Guest {{ $audit['summary']['guest_page_views'] }}</div></td>
<td class="card"><div class="label">Audit footprint</div><div class="value">{{ number_format($audit['summary']['total_events']) }}</div><div class="small">{{ $audit['summary']['unique_users'] }} users · {{ $audit['summary']['unique_sessions'] }} sessions · {{ $audit['summary']['unique_ips'] }} IPs</div></td>
<td class="card"><div class="label">Peak hour</div><div class="value">{{ collect($audit['visiting_hours'])->sortByDesc('visits')->first()['label'] ?? '—' }}</div><div class="small">Highest page-view volume in the selected period.</div></td>
</tr></table></div>

<div class="section"><div class="section-title">Recent activity</div>
<?php foreach (array_slice($learning['recent_activity'], 0, 12) as $item) { ?>
<div class="row"><b>{{ $item['user'] ?: 'Guest' }}</b> · {{ $item['action'] ?: $item['event_type'] }} <span style="float:right" class="mutedline">{{ $item['occurred_at'] }}</span><div class="mutedline">{{ $item['resource_type'] ?: $item['route_name'] ?: 'Platform activity' }}<?php echo $item['resource_id'] ? ' #' . $item['resource_id'] : ''; ?></div></div>
<?php } ?>
</div>

<div class="footer">Generated from live Learn With Flevian LMS administrative data. The report reflects records available at generation time.</div>
</body></html>
