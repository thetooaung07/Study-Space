package com.studyspace.exception;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.context.request.WebRequest;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class GlobalExceptionHandlerTest {

    private GlobalExceptionHandler exceptionHandler;
    private WebRequest webRequest;

    @BeforeEach
    void setUp() {
        exceptionHandler = new GlobalExceptionHandler();
        webRequest = mock(WebRequest.class);
    }

    @Test
    void handleRuntimeException_ShouldReturnBadRequest() {
        // Arrange
        RuntimeException exception = new RuntimeException("User not found");

        // Act
        ResponseEntity<Map<String, Object>> response = exceptionHandler.handleRuntimeException(exception, webRequest);

        // Assert
        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(400, response.getBody().get("status"));
        assertEquals("User not found", response.getBody().get("message"));
        assertNotNull(response.getBody().get("timestamp"));
    }

    @Test
    void handleGlobalException_ShouldReturnInternalServerError() {
        // Arrange
        Exception exception = new Exception("Unexpected error");

        // Act
        ResponseEntity<Map<String, Object>> response = exceptionHandler.handleGlobalException(exception, webRequest);

        // Assert
        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(500, response.getBody().get("status"));
        assertEquals("An unexpected error occurred", response.getBody().get("message"));
        assertNotNull(response.getBody().get("timestamp"));
    }
}
