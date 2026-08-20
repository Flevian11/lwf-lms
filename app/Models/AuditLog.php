<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AuditLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'actor_type',
        'session_id',
        'event_type',
        'action',
        'route_name',
        'path',
        'method',
        'status_code',
        'ip_address',
        'user_agent',
        'device_type',
        'device_name',
        'browser',
        'browser_version',
        'platform',
        'platform_version',
        'country_code',
        'country_name',
        'region',
        'city',
        'locality',
        'resource_type',
        'resource_id',
        'metadata',
        'occurred_at',
    ];

    protected function casts(): array
    {
        return [
            'status_code' => 'integer',
            'resource_id' => 'integer',
            'metadata' => 'array',
            'occurred_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}