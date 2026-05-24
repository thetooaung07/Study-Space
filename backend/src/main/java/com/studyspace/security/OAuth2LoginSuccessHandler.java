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

// Handles successful Google/GitHub OAuth2 logins 
@Component
@RequiredArgsConstructor
@Slf4j
public class OAuth2LoginSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;
    private final String FRONTEND_URL = "http://localhost:3000/auth/callback";
    private static final String ATTR_LOGIN = "login";

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws IOException, ServletException {
        log.info("OAuth2 authentication success, processing user...");
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
        String email = oAuth2User.getAttribute("email");
        String name = oAuth2User.getAttribute("name");
        log.debug("OAuth2 user attributes - email: {}, name: {}", email, name);
        
        final String avatarUrl = extractAvatarUrl(oAuth2User);
        final String finalEmail = determineEmail(oAuth2User, email);
        final String finalUsername = determineUsername(oAuth2User, email);

        User user = userRepository.findByEmail(finalEmail)
                .orElseGet(() -> createNewUser(oAuth2User, finalEmail, finalUsername, name, avatarUrl));

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

    private String extractAvatarUrl(OAuth2User oAuth2User) {
        Object avatarUrlObj = oAuth2User.getAttribute("avatar_url"); // GitHub
        if (avatarUrlObj != null) {
            return avatarUrlObj.toString();
        }
        Object pictureObj = oAuth2User.getAttribute("picture"); // Google
        if (pictureObj != null) {
            return pictureObj.toString();
        }
        return null;
    }

    private String determineEmail(OAuth2User oAuth2User, String email) {
        if (email != null) return email;
        String login = oAuth2User.getAttribute(ATTR_LOGIN);
        if (login != null) return login + "@github.com";
        return oAuth2User.getName() + "@google.com";
    }

    private String determineUsername(OAuth2User oAuth2User, String email) {
        String login = oAuth2User.getAttribute(ATTR_LOGIN);
        if (login != null) return login;
        if (email != null) return email.split("@")[0];
        return "user_" + UUID.randomUUID().toString().substring(0, 8);
    }

    private User createNewUser(OAuth2User oAuth2User, String email, String username, String name, String avatarUrl) {
        log.info("Creating new OAuth user: {}", email);
        User newUser = new User();
        newUser.setEmail(email);
        newUser.setUsername(username); 
        newUser.setFullName(name != null ? name : username);
        newUser.setProfilePictureUrl(avatarUrl);
        newUser.setCurrentStatus(com.studyspace.types.UserStatus.ONLINE);
        
        if (oAuth2User.getAttribute("gravatar_id") != null || oAuth2User.getAttribute(ATTR_LOGIN) != null) {
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
    }
}
