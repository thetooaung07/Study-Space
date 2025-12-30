package com.studyspace.security;

import com.studyspace.entity.User;
import com.studyspace.repository.UserRepository;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.util.UUID;

@Component
@RequiredArgsConstructor
@Slf4j
public class OAuth2LoginSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;
    private final String FRONTEND_URL = "http://localhost:3000/auth/callback";

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws IOException, ServletException {
        log.info("OAuth2 authentication success, processing user...");
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
        String email = oAuth2User.getAttribute("email");
        String name = oAuth2User.getAttribute("name");
        log.debug("OAuth2 user attributes - email: {}, name: {}", email, name);
        
        // Avatar Logic
        Object avatarUrlObj = oAuth2User.getAttribute("avatar_url"); // GitHub
        String initialAvatarUrl = avatarUrlObj != null ? avatarUrlObj.toString() : null;
        if (initialAvatarUrl == null) {
            Object pictureObj = oAuth2User.getAttribute("picture"); // Google
            if (pictureObj != null) {
                initialAvatarUrl = pictureObj.toString();
            }
        }
        final String avatarUrl = initialAvatarUrl;

        // Email Fallback Logic
        String finalEmail;
        if (email != null) {
            finalEmail = email;
        } else {
            String login = oAuth2User.getAttribute("login"); // GitHub username
            if (login != null) {
                finalEmail = login + "@github.com";
            } else {
                 finalEmail = oAuth2User.getName() + "@google.com";
            }
        }
        
        // Username Fallback Logic
        String login = oAuth2User.getAttribute("login");
        String finalUsername;
        if (login != null) {
             finalUsername = login;
        } else if (email != null) {
             finalUsername = email.split("@")[0];
        } else {
             finalUsername = "user_" + UUID.randomUUID().toString().substring(0, 8);
        }

        User user = userRepository.findByEmail(finalEmail)
                .orElseGet(() -> {
                    log.info("Creating new OAuth user: {}", finalEmail);
                    User newUser = new User();
                    newUser.setEmail(finalEmail);
                    newUser.setUsername(finalUsername); 
                    newUser.setFullName(name != null ? name : finalUsername);
                    newUser.setProfilePictureUrl(avatarUrl);
                    newUser.setCurrentStatus(com.studyspace.types.UserStatus.ONLINE);
                    
                    // Determine provider
                    if (oAuth2User.getAttribute("gravatar_id") != null || oAuth2User.getAttribute("login") != null) {
                         newUser.setAuthProvider(com.studyspace.types.AuthProvider.GITHUB);
                         log.debug("OAuth provider detected: GITHUB");
                    } else {
                         newUser.setAuthProvider(com.studyspace.types.AuthProvider.GOOGLE);
                         log.debug("OAuth provider detected: GOOGLE");
                    }
                    
                    newUser.setPassword(""); 
                    User saved = userRepository.save(newUser);
                    log.info("New OAuth user created with ID: {}", saved.getId());
                    return saved;
                });

        UserDetails userDetails = new org.springframework.security.core.userdetails.User(
                user.getEmail(),
                "",
                new java.util.ArrayList<>()
        );

        String token = jwtUtil.generateToken(userDetails);
        log.info("OAuth login successful for user: {} (ID: {})", user.getEmail(), user.getId());

        String targetUrl = UriComponentsBuilder.fromUriString(FRONTEND_URL)
                .queryParam("token", token)
                .build().toUriString();
        log.debug("Redirecting to: {}", FRONTEND_URL);

        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }
}
