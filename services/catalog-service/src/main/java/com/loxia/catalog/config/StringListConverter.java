package com.loxia.catalog.config;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

/**
 * JPA converter that maps a Java List&lt;String&gt; to a PostgreSQL TEXT[]
 * stored as a comma-separated string in the JDBC layer.
 *
 * This avoids relying on Hibernate-specific array types and keeps
 * the mapping simple for the project scope.
 */
@Converter(autoApply = false)
public class StringListConverter implements AttributeConverter<List<String>, String> {

    private static final String SEPARATOR = "|||";

    @Override
    public String convertToDatabaseColumn(List<String> attribute) {
        if (attribute == null || attribute.isEmpty()) {
            return "";
        }
        return String.join(SEPARATOR, attribute);
    }

    @Override
    public List<String> convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.isBlank()) {
            return Collections.emptyList();
        }
        return Arrays.asList(dbData.split("\\|\\|\\|"));
    }
}
