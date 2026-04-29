package com.studyspace.util;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;

/**
 * Utility class for getting current time in UTC timezone.
 * Use this instead of LocalDateTime.now() to ensure consistent UTC timestamps.
 */
public final class DateTimeUtil {
    
    private DateTimeUtil() {
        // Private constructor to prevent instantiation
    }
    
    /**
     * Get current time as LocalDateTime in UTC timezone.
     * Always use this instead of LocalDateTime.now() for database operations.
     */
    public static LocalDateTime nowUtc() {
        return Instant.now().atZone(ZoneOffset.UTC).toLocalDateTime();
    }
}
