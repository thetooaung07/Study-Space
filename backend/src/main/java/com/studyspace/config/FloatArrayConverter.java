package com.studyspace.config;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

import java.util.Arrays;
import java.util.stream.Collectors;

/**
 * JPA {@link AttributeConverter} that serialises a Java {@code float[]} to and from
 * the pgvector string literal format used by the {@code vector} column type.
 *
 * <p>Example: {@code [0.1, 0.2, 0.3]} ↔ {@code [0.1,0.2,0.3]}
 *
 * <p>This converter is referenced explicitly by {@link com.studyspace.entity.DocumentChunk}
 * via {@code @Convert(converter = FloatArrayConverter.class)}.
 */
@Converter
public class FloatArrayConverter implements AttributeConverter<float[], String> {

    @Override
    public String convertToDatabaseColumn(float[] embedding) {
        if (embedding == null || embedding.length == 0) return null;
        String values = Arrays.stream(toBoxed(embedding))
                .map(Object::toString)
                .collect(Collectors.joining(","));
        return "[" + values + "]";
    }

    @Override
    public float[] convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.isBlank()) return new float[0];
        // Strip surrounding brackets and split
        String inner = dbData.trim().replace("[", "").replace("]", "");
        String[] parts = inner.split(",");
        float[] result = new float[parts.length];
        for (int i = 0; i < parts.length; i++) {
            result[i] = Float.parseFloat(parts[i].trim());
        }
        return result;
    }

    // ─── helper ─────────────────────────────────────────────────────────────

    @SuppressWarnings("java:S3012")
    private Float[] toBoxed(float[] arr) {
        Float[] boxed = new Float[arr.length];
        for (int i = 0; i < arr.length; i++) boxed[i] = arr[i];
        return boxed;
    }
}
