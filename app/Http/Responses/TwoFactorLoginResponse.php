<?php

namespace App\Http\Responses;

use App\Support\AuthenticatedUserRedirect;
use Laravel\Fortify\Contracts\TwoFactorLoginResponse as TwoFactorLoginResponseContract;

class TwoFactorLoginResponse implements TwoFactorLoginResponseContract
{
    /**
     * Redirect the authenticated user after successful 2FA.
     */
    public function toResponse($request)
    {
        return $request->wantsJson()
            ? response()->json([
                'redirect' => AuthenticatedUserRedirect::to(
                    $request->user()
                )->getTargetUrl(),
            ])
            : AuthenticatedUserRedirect::to(
                $request->user()
            );
    }
}