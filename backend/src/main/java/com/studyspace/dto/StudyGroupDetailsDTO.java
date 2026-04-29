package com.studyspace.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudyGroupDetailsDTO {
    private StudyGroupDTO group;
    private List<StudySessionDTO> sessions;
    private List<GroupMemberDTO> members;
}
