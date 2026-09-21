<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" @class(['dark' => ($appearance ?? 'system') == 'dark', 'home' => $page['component'] === 'welcome'])>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        @if ($page['component'] === 'welcome')
            {{-- Server-rendered for crawlers (no SSR). DRAFT copy, final in 3.2; og-image.png lands in 3.1. --}}
            <meta name="description" content="ECU and TCU calibration, in our workshop or as a remote file service for tuners. Proven on recorded Dragy runs, stock vs tuned.">
            <meta property="og:type" content="website">
            <meta property="og:site_name" content="{{ config('app.name') }}">
            <meta property="og:title" content="{{ config('app.name') }} — ECU &amp; TCU calibration">
            <meta property="og:description" content="ECU and TCU calibration, in our workshop or as a remote file service for tuners. Proven on recorded Dragy runs, stock vs tuned.">
            <meta property="og:url" content="{{ url('/') }}">
            <meta property="og:image" content="{{ url('/brand/og-image.png') }}">
            <meta name="twitter:card" content="summary_large_image">
        @endif

        {{-- Inline script to detect system dark mode preference and apply it immediately --}}
        <script>
            (function() {
                const appearance = '{{ $appearance ?? "system" }}';

                if (appearance === 'system') {
                    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

                    if (prefersDark) {
                        document.documentElement.classList.add('dark');
                    }
                }
            })();
        </script>

        {{-- Inline style to set the HTML background color based on our theme in app.css --}}
        <style>
            html {
                background-color: oklch(1 0 0);
            }

            html.dark {
                background-color: oklch(0.145 0 0);
            }

            /* The homepage is always dark; !important beats the inline color-scheme set by use-appearance. */
            html.home {
                background-color: #0f0e0d;
                color-scheme: dark !important;
            }
        </style>

        <link rel="icon" href="/favicon.ico" sizes="any">
        <link rel="icon" href="/favicon.svg" type="image/svg+xml">
        <link rel="apple-touch-icon" href="/apple-touch-icon.png">

        @fonts

        @viteReactRefresh
        @vite(['resources/css/app.css', 'resources/js/app.tsx', "resources/js/pages/{$page['component']}.tsx"])
        <x-inertia::head>
            <title>{{ config('app.name', 'Laravel') }}</title>
        </x-inertia::head>
    </head>
    <body class="font-sans antialiased">
        <x-inertia::app />
    </body>
</html>
