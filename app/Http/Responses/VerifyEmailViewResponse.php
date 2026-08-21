<?php

namespace App\Http\Responses;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;
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
        ])->toResponse($request);
    }
}