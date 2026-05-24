package com.studyspace.exception;

import com.studyspace.util.DateTimeUtil;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
@lombok.extern.slf4j.Slf4j
public class GlobalExceptionHandler {
    
    private static final String FIELD_TIMESTAMP = "timestamp";
    private static final String FIELD_STATUS = "status";
    private static final String FIELD_MESSAGE = "message";

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidationExceptions(
        MethodArgumentNotValidException ex,
        WebRequest request
    ) {
        log.error("Validation error: ", ex);
        Map<String, Object> body = new HashMap<>();
        body.put(FIELD_TIMESTAMP, DateTimeUtil.nowUtc());
        body.put(FIELD_STATUS, HttpStatus.BAD_REQUEST.value());
        body.put(FIELD_MESSAGE, "Validation failed");
        body.put("errors", ex.getBindingResult().getFieldErrors()
            .stream()
            .map(error -> error.getField() + ": " + error.getDefaultMessage())
            .toArray());
        
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }
    
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleResourceNotFoundException(
        ResourceNotFoundException ex,
        WebRequest request
    ) {
        log.warn("Resource not found: {}", ex.getMessage());
        Map<String, Object> body = new HashMap<>();
        body.put(FIELD_TIMESTAMP, DateTimeUtil.nowUtc());
        body.put(FIELD_STATUS, HttpStatus.NOT_FOUND.value());
        body.put(FIELD_MESSAGE, ex.getMessage());
        
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(body);
    }

    @ExceptionHandler(BadRequestException.class)
    public ResponseEntity<Map<String, Object>> handleBadRequestException(
        BadRequestException ex,
        WebRequest request
    ) {
        log.warn("Bad request: {}", ex.getMessage());
        Map<String, Object> body = new HashMap<>();
        body.put(FIELD_TIMESTAMP, DateTimeUtil.nowUtc());
        body.put(FIELD_STATUS, HttpStatus.BAD_REQUEST.value());
        body.put(FIELD_MESSAGE, ex.getMessage());
        
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, Object>> handleRuntimeException(
        RuntimeException ex,
        WebRequest request
    ) {
        log.error("Runtime exception occurred: ", ex);
        Map<String, Object> body = new HashMap<>();
        body.put(FIELD_TIMESTAMP, DateTimeUtil.nowUtc());
        body.put(FIELD_STATUS, HttpStatus.BAD_REQUEST.value());
        body.put(FIELD_MESSAGE, ex.getMessage());
        
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }

    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<Map<String, Object>> handleNoResourceFoundException(
        NoResourceFoundException ex,
        WebRequest request
    ) {
        log.warn("Resource not found: {}", ex.getResourcePath());
        Map<String, Object> body = new HashMap<>();
        body.put(FIELD_TIMESTAMP, DateTimeUtil.nowUtc());
        body.put(FIELD_STATUS, HttpStatus.NOT_FOUND.value());
        body.put(FIELD_MESSAGE, "Resource not found: " + ex.getResourcePath());
        
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(body);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGlobalException(
        Exception ex,
        WebRequest request
    ) {
        log.error("Unexpected error occurred: ", ex);
        Map<String, Object> body = new HashMap<>();
        body.put(FIELD_TIMESTAMP, DateTimeUtil.nowUtc());
        body.put(FIELD_STATUS, HttpStatus.INTERNAL_SERVER_ERROR.value());
        body.put(FIELD_MESSAGE, "An unexpected error occurred");
        
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(body);
    }
}
