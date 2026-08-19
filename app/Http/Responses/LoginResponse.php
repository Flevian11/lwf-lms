<?php

namespace App\Http\Responses;

use App\Support\AuthenticatedUserRedirect;
use Laravel\Fortify\Contracts\LoginResponse as LoginResponseContract;

class LoginResponse implements LoginResponseContract
{
    /**
     * Create an HTTP response after successful authentication.
     */
    public function toResponse($request)
    {
        if ($request->wantsJson()) {
            return response()->json([
                'two_factor' => false,
            ]);
        }

        return AuthenticatedUserRedirect::to($request->user());
    }
}