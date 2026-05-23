package com.studyspace.service.llm;

/**
 * Abstraction over LLM providers used for query generation and summarisation.
 *
 * <p>Two implementations are registered as Spring beans:
 * <ul>
 *   <li>{@link GeminiLlmProvider} — Google Gemini via the official GenAI Java SDK.</li>
 *   <li>{@link OpenAiLlmProvider} — OpenAI GPT via the REST API using Spring's RestClient.</li>
 * </ul>
 *
 * <p>The active provider is selected at call-time by the {@code provider} field in
 * {@link com.studyspace.dto.ChatQueryRequest}. Embedding generation always uses Gemini
 * regardless of the selected query provider.
 */
public interface LlmProvider {

    /**
     * Generates an answer for the given fully-assembled prompt.
     *
     * @param prompt complete prompt string (system + memory + RAG chunks + question)
     * @return the model's response as a plain string
     */
    String generate(String prompt);

    /**
     * Generates an updated rolling summary from the provided summarisation prompt.
     * Used exclusively by the async memory compressor.
     *
     * @param summarisationPrompt pre-built prompt from {@link com.studyspace.service.PromptBuilder}
     * @return updated summary text
     */
    String generateSummary(String summarisationPrompt);

    /**
     * Returns the lowercase identifier used to select this provider in API requests.
     *
     * @return {@code "gemini"} or {@code "openai"}
     */
    String providerName();
}
