<?php

namespace App\Services;

use App\Models\Course;
use App\Models\CourseEnrollment;
use App\Models\CourseMaterial;
use App\Models\CourseModule;
use App\Models\Lesson;
use App\Models\User;

class CourseAccessService
{
    /**
     * Determine the student's effective course access level.
     *
     * free    = free course, full access
     * full    = paid course with granted access
     * preview = paid course without granted access
     */
    public function accessLevel(
        User $user,
        Course $course,
    ): string {
        if ($this->isFreeCourse($course)) {
            return 'free';
        }

        return $this->hasGrantedEnrollment($user, $course)
            ? 'full'
            : 'preview';
    }

    /**
     * Determine whether the course is completely accessible.
     */
    public function hasFullAccess(
        User $user,
        Course $course,
    ): bool {
        return in_array(
            $this->accessLevel($user, $course),
            ['free', 'full'],
            true,
        );
    }

    /**
     * Determine whether the course is free.
     */
    public function isFreeCourse(Course $course): bool
    {
        return $course->access_type === 'free';
    }

    /**
     * Determine whether the student has a valid enrollment
     * granting full access.
     */
    public function hasGrantedEnrollment(
        User $user,
        Course $course,
    ): bool {
        return $this->enrollment($user, $course)?->hasAccess() === true;
    }

    /**
     * Determine whether a module can be opened.
     *
     * Free courses and granted paid courses are unrestricted.
     *
     * Otherwise the module must explicitly be configured
     * as preview content.
     */
    public function canAccessModule(
        User $user,
        CourseModule $module,
    ): bool {
        $course = $module->course;

        if (! $course) {
            return false;
        }

        if ($this->hasFullAccess($user, $course)) {
            return true;
        }

        return $module->is_preview === true;
    }

    /**
     * Determine whether a lesson can be opened.
     *
     * A lesson is previewable when:
     *
     * - it is explicitly marked as preview, OR
     * - its parent module is explicitly marked as preview.
     *
     * Full-access students bypass preview restrictions.
     */
    public function canAccessLesson(
        User $user,
        Lesson $lesson,
    ): bool {
        $module = $lesson->module;

        if (! $module) {
            return false;
        }

        $course = $module->course;

        if (! $course) {
            return false;
        }

        if ($this->hasFullAccess($user, $course)) {
            return true;
        }

        return $lesson->is_preview === true
            || $module->is_preview === true;
    }

    /**
     * Determine whether a material can be accessed.
     *
     * Full-access students can access every published material.
     *
     * Preview students can access a material only when:
     *
     * - the material itself is explicitly previewable, OR
     * - its lesson is previewable, OR
     * - its module is previewable.
     */
    public function canAccessMaterial(
        User $user,
        CourseMaterial $material,
    ): bool {
        $course = $material->course;

        if (! $course) {
            return false;
        }

        if ($material->status !== 'published') {
            return false;
        }

        if ($this->hasFullAccess($user, $course)) {
            return true;
        }

        if ($material->is_preview) {
            return true;
        }

        $lesson = $material->lesson;

        if ($lesson && $this->canAccessLesson($user, $lesson)) {
            return true;
        }

        $module = $material->module;

        return $module !== null
            && $this->canAccessModule($user, $module);
    }

    /**
     * Determine whether a material is explicitly configured
     * as a preview resource.
     */
    public function isPreviewMaterial(
        CourseMaterial $material,
    ): bool {
        return $material->status === 'published'
            && $material->is_preview === true;
    }

    /**
     * Return the student's current enrollment.
     */
    public function enrollment(
        User $user,
        Course $course,
    ): ?CourseEnrollment {
        return $course->enrollments()
            ->where('user_id', $user->id)
            ->latest('id')
            ->first();
    }
}