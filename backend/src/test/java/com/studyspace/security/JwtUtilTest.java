package com.studyspace.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collections;

import static org.junit.jupiter.api.Assertions.*;

class JwtUtilTest {

    private JwtUtil jwtUtil;
    private UserDetails userDetails;

    @BeforeEach
    void setUp() {
        jwtUtil = new JwtUtil();
        userDetails = new User("alice@example.com", "password", Collections.emptyList());
    }

    @Test
    void generateToken_ReturnsNonNullToken() {
        String token = jwtUtil.generateToken(userDetails);
        assertNotNull(token);
        assertFalse(token.isBlank());
    }

    @Test
    void extractUsername_MatchesSubject() {
        String token = jwtUtil.generateToken(userDetails);
        String extracted = jwtUtil.extractUsername(token);
        assertEquals("alice@example.com", extracted);
    }

    @Test
    void isTokenValid_ValidToken_ReturnsTrue() {
        String token = jwtUtil.generateToken(userDetails);
        assertTrue(jwtUtil.isTokenValid(token, userDetails));
    }

    @Test
    void isTokenValid_WrongUser_ReturnsFalse() {
        String token = jwtUtil.generateToken(userDetails);
        UserDetails other = new User("bob@example.com", "password", Collections.emptyList());
        assertFalse(jwtUtil.isTokenValid(token, other));
    }

    @Test
    void generateToken_WithExtraClaims_ExtractsUsernameCorrectly() {
        java.util.Map<String, Object> claims = new java.util.HashMap<>();
        claims.put("role", "STUDENT");
        String token = jwtUtil.generateToken(claims, userDetails);
        assertEquals("alice@example.com", jwtUtil.extractUsername(token));
    }

    @Test
    void isTokenValid_TamperedToken_ThrowsOrReturnsFalse() {
        String token = jwtUtil.generateToken(userDetails);
        // Append an extra character to invalidate the signature
        String tampered = token + "X";
        assertThrows(Exception.class, () -> jwtUtil.isTokenValid(tampered, userDetails));
    }
}
