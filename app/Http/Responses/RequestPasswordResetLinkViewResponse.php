<?php

namespace App\Http\Responses;

use Inertia\Inertia;
use Laravel\Fortify\Contracts\RequestPasswordResetLinkViewResponse as RequestPasswordResetLinkViewResponseContract;

class RequestPasswordResetLinkViewResponse implements RequestPasswordResetLinkViewResponseContract
{
    /**
     * Create the HTTP response that displays the password reset request page.
     */
    public function toResponse($request)
    {
        return Inertia::render('Auth/ForgotPassword', [
            'status' => session('status'),
        ]);
    }
}