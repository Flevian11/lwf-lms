<!DOCTYPE html>
<html
    lang="{{ str_replace('_', '-', app()->getLocale()) }}"
    dir="ltr"
>
    <head>
        <meta charset="utf-8">

        @head

        @viteReactRefresh
        @vite('resources/js/app.tsx')

        <x-inertia::head />
    </head>

    <body class="antialiased">
        <x-inertia::app />
    </body>
</html>