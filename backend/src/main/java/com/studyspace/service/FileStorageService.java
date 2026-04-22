package com.studyspace.service;

import org.springframework.web.multipart.MultipartFile;

public interface FileStorageService {

    /**
     * Store a file and return its accessible URL.
     *
     * @param file   the multipart file to store
     * @param folder sub-folder path (e.g. "courses")
     * @return the URL at which the file can be accessed
     */
    String store(MultipartFile file, String folder);

    /**
     * Delete a previously stored file.
     *
     * @param fileUrl the URL returned by {@link #store}
     */
    void delete(String fileUrl);

    /**
     * Copy an existing stored file to a new location.
     * Used for copy-on-write semantics when forking or approving contributions.
     *
     * @param sourceFileUrl the URL of the source file
     * @param targetFolder  sub-folder path for the copy (e.g. "courses")
     * @return the URL at which the copied file can be accessed
     */
    String copy(String sourceFileUrl, String targetFolder);
}
