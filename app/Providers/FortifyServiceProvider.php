<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Inertia\Inertia;
use Laravel\Fortify\Fortify;

class FortifyServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        /*
         * Inertia authentication views.
         *
         * Fortify remains responsible for the authentication backend,
         * while React/TSX renders the actual frontend.
         */

        Fortify::loginView(function () {
            return Inertia::render('Auth/Login', [
                'canResetPassword' => true,
                'canRegister' => true,
                'status' => session('status'),
            ]);
        });

        Fortify::registerView(function () {
            return Inertia::render('Auth/Register', [
                'canLogin' => true,
            ]);
        });
    }
}