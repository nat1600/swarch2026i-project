package com.carlos.gamificationservice.services;

import com.carlos.gamificationservice.dtos.UserGameSessionMapper;
import com.carlos.gamificationservice.dtos.dtosImpl.BooleanDTO;
import com.carlos.gamificationservice.dtos.dtosImpl.UserGameSessionDTO;
import com.carlos.gamificationservice.models.UserGameSession;
import com.carlos.gamificationservice.repository.UserGameSessionRepository;
import com.carlos.gamificationservice.services.servicesImpl.UserGameSessionServiceImplementation;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;


import java.time.LocalDate;
import java.util.List;

import static org.mockito.Mockito.times;
import static org.mockito.Mockito.when;


@ExtendWith(MockitoExtension.class)
public class UserGameSessionServiceTest {

    @Mock
    private UserGameSessionRepository userGameSessionRepository;
    @Mock
    private UserGameSessionMapper userGameSessionMapper;

    @InjectMocks
    private UserGameSessionServiceImplementation userGameSessionServiceImplementation;

    // ===================== saveUserGameSession =====================

    @Test
    public void testSaveUserGameSession_Success() throws Exception {

        UserGameSessionDTO dto = new UserGameSessionDTO("Ninja_Poliglota", "Chess", 12, LocalDate.now());
        UserGameSession entity = new UserGameSession(1L, dto.getUserName(), dto.getGamePlayed(), dto.getPoints(), dto.getSessionDate());

        when(userGameSessionMapper.toUserGameSession(dto)).thenReturn(entity);

        UserGameSessionDTO result = userGameSessionServiceImplementation.saveUserGameSession(dto);

        assertEquals(dto, result);
        verify(userGameSessionRepository, times(1)).save(entity);
    }

    @Test
    public void testSaveUserGameSession_Failure() throws Exception {

        UserGameSessionDTO dto = new UserGameSessionDTO("Ninja_Poliglota", "Chess", 12, LocalDate.now());

        when(userGameSessionMapper.toUserGameSession(dto))
                .thenThrow(new RuntimeException("Saving Failed"));

        UserGameSessionDTO result = userGameSessionServiceImplementation.saveUserGameSession(dto);

        assertNull(result);

    }

    // ===================== deleteAllUserGameSessions =====================

    @Test
    public void testDeleteAllUserGameSessions_Success() throws Exception {

        String userName = "Ninja_Poliglota";

        // Mockito handles void methods by itself, hence we don't need to mock this kind of methods were nothing is returned.
        // doNothing().when(userGameSessionRepository).deleteUserGameSessionsByUserName(userName);

        BooleanDTO result = userGameSessionServiceImplementation.deleteAllUserGameSessions(userName);

        assertTrue(result.isStatus());
        verify(userGameSessionRepository, times(1)).deleteUserGameSessionsByUserName(userName);

    }

    @Test
    public void testDeleteAllUserGameSessions_Failure() throws Exception {

        String userName = "Ninja_Poliglota";

        doThrow(new RuntimeException("Delete failed"))
                .when(userGameSessionRepository).deleteUserGameSessionsByUserName(userName);

        BooleanDTO result = userGameSessionServiceImplementation.deleteAllUserGameSessions(userName);

        assertFalse(result.isStatus());

    }

    // ===================== deleteAllUserGameSessionsPerDate =====================

    @Test
    public void testDeleteAllUserGameSessionsPerDate_Success() throws Exception {

        String userName = "Ninja_Poliglota";
        LocalDate intendedDate = LocalDate.now();

        BooleanDTO result = userGameSessionServiceImplementation.deleteAllUserGameSessionsPerDate(userName, intendedDate);

        assertTrue(result.isStatus());
        verify(userGameSessionRepository, times(1)).deleteByUserNameAndSessionDate(userName, intendedDate);

    }

    @Test
    public void testDeleteAllUserGameSessionsPerDate_Failure() throws Exception {

        String userName = "Ninja_Poliglota";
        LocalDate intendedDate = LocalDate.now();

        doThrow(new RuntimeException("Delete failed"))
                .when(userGameSessionRepository).deleteByUserNameAndSessionDate(userName, intendedDate);

        BooleanDTO result = userGameSessionServiceImplementation.deleteAllUserGameSessionsPerDate(userName, intendedDate);

        assertFalse(result.isStatus());

    }

    // ===================== getAllUserGameSessions =====================

    @Test
    public void testGetAllUserGameSessions_ReturnsList() throws Exception {

        String userName = "Ninja_Poliglota";
        List<UserGameSession> gameSessions = List.of(new UserGameSession(), new UserGameSession());

        when(userGameSessionRepository.getAllByUserName(userName)).thenReturn(gameSessions);

        List<UserGameSession> result = userGameSessionServiceImplementation.getAllUserGameSessions(userName);

        assertEquals(2, result.size());
        verify(userGameSessionRepository, times(1)).getAllByUserName(userName);

    }

    @Test
    public void testGetAllUserGameSessions_ReturnsEmpty() throws Exception {

        String userName = "Ninja_Poliglota";

        when(userGameSessionRepository.getAllByUserName(userName)).thenReturn(List.of());

        List<UserGameSession> result = userGameSessionServiceImplementation.getAllUserGameSessions(userName);

        assertEquals(0, result.size());

    }

    // ===================== getAllUserGameSessionsPerDate =====================

    @Test
    public void testGetAllUserGameSessionsPerDate_ReturnsList() throws Exception {

        String userName = "Ninja_Poliglota";
        LocalDate intendedDate = LocalDate.now();
        List<UserGameSession> gameSessions = List.of(new UserGameSession(), new UserGameSession());

        when(userGameSessionRepository.getAllByUserNameAndSessionDate(userName, intendedDate)).thenReturn(gameSessions);

        List<UserGameSession> result = userGameSessionServiceImplementation.getAllUserGameSessionsPerDate(userName, intendedDate);

        assertEquals(2, result.size());
        verify(userGameSessionRepository, times(1)).getAllByUserNameAndSessionDate(userName, intendedDate);

    }

    @Test
    public void testGetAllUserGameSessionsPerDate_ReturnsEmpty() throws Exception {

        String userName = "Ninja_Poliglota";
        LocalDate intendedDate = LocalDate.now();

        when(userGameSessionRepository.getAllByUserNameAndSessionDate(userName, intendedDate)).thenReturn(List.of());

        List<UserGameSession> result = userGameSessionServiceImplementation.getAllUserGameSessionsPerDate(userName, intendedDate);

        assertEquals(0, result.size());

    }

    // ===================== getAllUserGameSessionsPerPoints =====================

    @Test
    public void testGetAllUserGameSessionsPerPoints_ReturnsList() throws Exception {

        String userName = "Ninja_Poliglota";
        Integer intendedPoints = 100;
        List<UserGameSession> gameSessions = List.of(new UserGameSession(), new UserGameSession());

        when(userGameSessionRepository.getAllByUserNameAndPoints(userName, intendedPoints)).thenReturn(gameSessions);

        List<UserGameSession> result = userGameSessionServiceImplementation.getAllUserGameSessionsPerPoints(userName, intendedPoints);

        assertEquals(2, result.size());
        verify(userGameSessionRepository, times(1)).getAllByUserNameAndPoints(userName, intendedPoints);

    }

    @Test
    public void testGetAllUserGameSessionsPerPoints_ReturnsEmpty() throws Exception {

        String userName = "Ninja_Poliglota";
        Integer intendedPoints = 100;

        when(userGameSessionRepository.getAllByUserNameAndPoints(userName, intendedPoints)).thenReturn(List.of());

        List<UserGameSession> result = userGameSessionServiceImplementation.getAllUserGameSessionsPerPoints(userName, intendedPoints);

        assertEquals(0, result.size());

    }


}
