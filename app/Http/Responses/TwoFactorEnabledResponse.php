<?php

namespace App\Http\Responses;

use Illuminate\Http\JsonResponse;
use Laravel\Fortify\Contracts\TwoFactorEnabledResponse as TwoFactorEnabledResponseContract;
use Laravel\Fortify\Fortify;

class TwoFactorEnabledResponse implements TwoFactorEnabledResponseContract
{
    /**
     * Return the response after enabling two-factor authentication.
     */
    public function toResponse($request)
    {
        return $request->wantsJson()
            ? new JsonResponse([
                'status' => Fortify::TWO_FACTOR_AUTHENTICATION_ENABLED,
            ], 200)
            : back()->with(
                'status',
                Fortify::TWO_FACTOR_AUTHENTICATION_ENABLED
            );
    }
}