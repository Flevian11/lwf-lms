<?php

namespace App\Http\Responses;

use App\Support\AuthenticatedUserRedirect;
use Illuminate\Http\JsonResponse;
use Laravel\Fortify\Contracts\VerifyEmailResponse as VerifyEmailResponseContract;

class VerifyEmailResponse implements VerifyEmailResponseContract
{
    /**
     * Create an HTTP response after successful email verification.
     */
    public function toResponse($request)
    {
        if ($request->wantsJson()) {
            return new JsonResponse('', 204);
        }

        return AuthenticatedUserRedirect::to($request->user());
    }
}