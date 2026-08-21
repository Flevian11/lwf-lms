<?php

namespace App\Exceptions;

use RuntimeException;
use Throwable;

class AssignmentSubmissionEmailException extends RuntimeException
{
    public function __construct(string $message, ?Throwable $previous = null)
    {
        parent::__construct($message, 0, $previous);
    }
}
