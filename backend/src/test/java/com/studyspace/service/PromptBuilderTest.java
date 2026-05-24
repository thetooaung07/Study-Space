package com.studyspace.service;

import com.studyspace.entity.Message;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertTrue;

class PromptBuilderTest {

    private PromptBuilder promptBuilder;

    @BeforeEach
    void setUp() {
        promptBuilder = new PromptBuilder();
    }

    @Test
    void buildRuntimePrompt_WithAllComponents_IncludesEverything() {
        String summary = "This is a past summary.";
        List<Message> recentMessages = List.of(
                Message.builder().role("user").content("Hello?").build(),
                Message.builder().role("assistant").content("Hi!").build()
        );
        List<String> ragChunks = List.of("Excerpt data 1", "Excerpt data 2");
        String question = "What is data 1?";

        String prompt = promptBuilder.buildRuntimePrompt(summary, recentMessages, ragChunks, question);

        assertTrue(prompt.contains("This is a past summary."));
        assertTrue(prompt.contains("Student: Hello?"));
        assertTrue(prompt.contains("Assistant: Hi!"));
        assertTrue(prompt.contains("Excerpt data 1"));
        assertTrue(prompt.contains("Excerpt data 2"));
        assertTrue(prompt.contains("What is data 1?"));
    }

    @Test
    void buildRuntimePrompt_WithoutSummary_SkipsSummarySection() {
        List<Message> recentMessages = List.of(Message.builder().role("user").content("Hello?").build());
        String question = "What is data 1?";

        String prompt = promptBuilder.buildRuntimePrompt("", recentMessages, null, question);

        assertTrue(prompt.contains("Student: Hello?"));
        assertTrue(prompt.contains("What is data 1?"));
        assertTrue(!prompt.contains("Conversation Summary (long-term memory)"));
    }

    @Test
    void buildSummarisationPrompt_CreatesCorrectPrompt() {
        String oldSummary = "Old sum";
        List<Message> messages = List.of(
                Message.builder().role("user").content("Need help").build()
        );

        String prompt = promptBuilder.buildSummarisationPrompt(oldSummary, messages);

        assertTrue(prompt.contains("Old sum"));
        assertTrue(prompt.contains("Student: Need help"));
        assertTrue(prompt.contains("Write an updated long-term summary"));
    }

    @Test
    void buildSummarisationPromptFromPairs_WithNoOldSummary_CreatesCorrectPrompt() {
        List<String[]> pairs = java.util.Collections.singletonList(new String[]{"user", "Hello"});

        String prompt = promptBuilder.buildSummarisationPromptFromPairs("", pairs);

        assertTrue(prompt.contains("(none — this is the first compression)"));
        assertTrue(prompt.contains("Student: Hello"));
    }
}
