package com.studyspace;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class StudySpaceApplication {

    public static void main(String[] args) {
        SpringApplication.run(StudySpaceApplication.class, args);
    }

}
