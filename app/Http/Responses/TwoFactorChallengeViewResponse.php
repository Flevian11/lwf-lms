<?php

namespace App\Http\Responses;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Laravel\Fortify\Contracts\TwoFactorChallengeViewResponse as TwoFactorChallengeViewResponseContract;
use Symfony\Component\HttpFoundation\Response;

class TwoFactorChallengeViewResponse implements TwoFactorChallengeViewResponseContract
{
    /**
     * Create the two-factor authentication challenge response.
     */
    public function toResponse($request): Response
    {
        return Inertia::render('Auth/TwoFactorChallenge')
            ->toResponse($request);
    }
}