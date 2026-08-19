<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'user_id',
    'provider',
    'provider_id',
    'provider_email',
    'provider_name',
    'provider_avatar_url',
    'access_token',
    'refresh_token',
    'token_expires_at',
])]
#[Hidden([
    'access_token',
    'refresh_token',
])]
class SocialAccount extends \Illuminate\Database\Eloquent\Model
{
    /**
     * The user who owns this external authentication account.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'token_expires_at' => 'datetime',
        ];
    }
}