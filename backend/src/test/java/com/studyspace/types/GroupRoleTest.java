package com.studyspace.types;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

class GroupRoleTest {

    @Test
    void testEnumValues() {
        GroupRole[] roles = GroupRole.values();
        assertEquals(2, roles.length);
        assertEquals(GroupRole.MEMBER, roles[0]);
        assertEquals(GroupRole.ADMIN, roles[1]);
    }

    @Test
    void testValueOf() {
        assertEquals(GroupRole.MEMBER, GroupRole.valueOf("MEMBER"));
        assertEquals(GroupRole.ADMIN, GroupRole.valueOf("ADMIN"));
    }
}
