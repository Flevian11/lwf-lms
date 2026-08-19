<?php

namespace App\Support;

use Laravel\Head\Enums\OgType;
use Laravel\Head\Facades\Head;

final class Seo
{
    /**
     * Configure an indexable public page.
     */
    public static function publicPage(
        string $title,
        string $description,
        ?string $canonical = null,
        ?string $image = null,
        ?string $imageAlt = null,
        OgType $ogType = OgType::Website,
    ): void {
        Head::title($title)
            ->description($description)
            ->canonical($canonical ?? request()->url())
            ->og(type: $ogType)
            ->searchableByRobots()
            ->when(
                $image !== null,
                fn ($head) => $head->ogImage(
                    $image,
                    alt: $imageAlt ?? $title,
                ),
            );
    }

    /**
     * Configure a private application page.
     */
    public static function privatePage(
        string $title,
        ?string $description = null,
    ): void {
        $head = Head::title($title)
            ->hiddenFromRobots();

        if ($description !== null) {
            $head->description($description);
        }
    }

    /**
     * Configure a dynamic course page.
     */
    public static function course(
        string $title,
        string $description,
        string $canonical,
        ?string $image = null,
        ?string $imageAlt = null,
    ): void {
        self::publicPage(
            title: $title,
            description: $description,
            canonical: $canonical,
            image: $image,
            imageAlt: $imageAlt,
            ogType: OgType::Article,
        );
    }
}