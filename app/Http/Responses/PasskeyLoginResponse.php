<?php

declare(strict_types=1);

namespace App\Http\Responses;

use App\Support\AuthenticatedUserRedirect;
use Illuminate\Http\JsonResponse;
use Laravel\Passkeys\Contracts\PasskeyLoginResponse as PasskeyLoginResponseContract;

class PasskeyLoginResponse implements PasskeyLoginResponseContract
{
    /**
     * Return a deterministic destination after successful passkey authentication.
     *
     * The passkey client uses a JSON response. Returning the redirect target here
     * prevents the package/browser fallback from sending an authenticated admin to
     * the student dashboard.
     */
    public function toResponse($request)
    {
        $target = AuthenticatedUserRedirect::targetUrl($request->user());

        $acceptsJson = $request->expectsJson()
            || $request->ajax()
            || str_contains((string) $request->header('Accept'), 'application/json');

        if ($acceptsJson) {
            return new JsonResponse([
                'authenticated' => true,
                'redirect' => $target,
            ], 200, [
                'Cache-Control' => 'no-store, no-cache, must-revalidate',
            ]);
        }

        return AuthenticatedUserRedirect::to($request->user());
    }
}
