<?php

namespace App\Http\Responses;

use Illuminate\Http\JsonResponse;
use Laravel\Fortify\Contracts\TwoFactorDisabledResponse as TwoFactorDisabledResponseContract;
use Laravel\Fortify\Fortify;

class TwoFactorDisabledResponse implements TwoFactorDisabledResponseContract
{
    /**
     * Return the response after disabling two-factor authentication.
     */
    public function toResponse($request)
    {
        return $request->wantsJson()
            ? new JsonResponse([
                'status' => Fortify::TWO_FACTOR_AUTHENTICATION_DISABLED,
            ], 200)
            : back()->with(
                'status',
                Fortify::TWO_FACTOR_AUTHENTICATION_DISABLED
            );
    }
}