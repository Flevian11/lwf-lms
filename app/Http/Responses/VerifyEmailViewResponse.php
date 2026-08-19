<?php

namespace App\Http\Responses;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Laravel\Fortify\Contracts\VerifyEmailViewResponse as VerifyEmailViewResponseContract;

class VerifyEmailViewResponse implements VerifyEmailViewResponseContract
{
    /**
     * Display the email verification page.
     */
    public function toResponse($request): Response
    {
        return Inertia::render('Auth/VerifyEmail', [
            'status' => session('status'),
        ]);
    }
}