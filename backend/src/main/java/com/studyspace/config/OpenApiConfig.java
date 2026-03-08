package com.studyspace.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;


// swagger configuration
@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI studySpaceOpenAPI() {
        return new OpenAPI()
                .info(new Info().title("StudySpace API")
                        .description("API documentation for StudySpace application")
                        .version("v1.0"));
    }
}
