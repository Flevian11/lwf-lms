<?php

declare(strict_types=1);

namespace App\Http\Responses;

use App\Support\AuthenticatedUserRedirect;
use Illuminate\Http\JsonResponse;
use Laravel\Passkeys\Contracts\PasskeyLoginResponse as PasskeyLoginResponseContract;

class PasskeyLoginResponse implements PasskeyLoginResponseContract
{
    /**
     * Create an HTTP response after successful passkey authentication.
     */
    public function toResponse($request)
    {
        if ($request->wantsJson()) {
            return new JsonResponse([
                'redirect' => route(
                    'dashboard'
                ),
            ], 200);
        }

        return AuthenticatedUserRedirect::to($request->user());
    }
}