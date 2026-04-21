package com.carlos.gamificationservice.services;

import com.carlos.gamificationservice.repository.LeaderBoardRepository;
import com.carlos.gamificationservice.services.servicesImpl.LeaderBoardServiceImplementation;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.carlos.gamificationservice.dtos.dtosImpl.BooleanDTO;
import org.springframework.data.redis.core.DefaultTypedTuple;
import org.springframework.data.redis.core.ZSetOperations;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;


import java.util.List;

import static org.mockito.Mockito.times;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class LeaderBoardServiceTest {

    @Mock
    private LeaderBoardRepository leaderBoardRepository;

    @InjectMocks
    private LeaderBoardServiceImplementation leaderBoardServiceImplementation;


    // ===================== incrementScore =====================

    @Test
    public void testIncrementScore_Success() throws Exception { // OK

        String userId = "Ninja_Poliglota";
        int points = 100;

        BooleanDTO result = leaderBoardServiceImplementation.incrementScore(userId, points);

        assertTrue(result.isStatus());
        verify(leaderBoardRepository, times(1)).incrementScore(userId, points);

    }

    @Test
    public void testIncrementScore_Failure() throws Exception { // OK

        String userId = "Ninja_Poliglota";
        int points = 100;

        doThrow(new RuntimeException("Increment failed"))
                .when(leaderBoardRepository).incrementScore(userId, points);

        BooleanDTO result = leaderBoardServiceImplementation.incrementScore(userId, points);

        assertFalse(result.isStatus());
        verify(leaderBoardRepository, times(1)).incrementScore(userId, points);


    }

    // ===================== getTopNUsers =====================

    @Test
    public void testGetTopNUsers_ReturnsList() throws Exception { // OK

        int weekYear = 2024;
        int weekNumber = 11;
        int topNUsers = 15;

        List<ZSetOperations.TypedTuple<String>> leaderBoard = List.of(
                new DefaultTypedTuple<>("Ninja_Poliglota", 100.0),
                new DefaultTypedTuple<>("Pedro_Sanchez", 80.0),
                new DefaultTypedTuple<>("Carlos_Dev", 60.0)
        );

        when(leaderBoardRepository.getTopN(weekYear, weekNumber, topNUsers)).thenReturn(leaderBoard);

        List<ZSetOperations.TypedTuple<String>> result = leaderBoardServiceImplementation.getTopNUsers(weekYear, weekNumber, topNUsers);

        assertEquals(3, result.size());
        verify(leaderBoardRepository, times(1)).getTopN(weekYear, weekNumber, topNUsers);

    }

    @Test
    public void testGetTopNUsers_ReturnsEmpty() throws Exception { // OK

        int weekYear = 2024;
        int weekNumber = 11;
        int topNUsers = 15;

        when(leaderBoardRepository.getTopN(weekYear, weekNumber, topNUsers)).thenReturn(List.of());

        List<ZSetOperations.TypedTuple<String>> result = leaderBoardServiceImplementation.getTopNUsers(weekYear, weekNumber, topNUsers);

        assertEquals(0, result.size());

    }

    // ===================== getUserScore =====================

    @Test
    public void testGetUserScore_ReturnsScore() throws Exception { // OK

        String userId = "Ninja_Poliglota";
        int weekYear = 2024;
        int weekNumber = 11;

        when(leaderBoardRepository.getScore(userId, weekYear, weekNumber)).thenReturn(100);

        int result = leaderBoardServiceImplementation.getUserScore(userId, weekYear, weekNumber);

        assertEquals(100, result);
        verify(leaderBoardRepository, times(1)).getScore(userId, weekYear, weekNumber);

    }

    @Test
    public void testGetUserScore_ReturnsZero() throws Exception { // OK

        String userId = "Ninja_Poliglota";
        int weekYear = 2024;
        int weekNumber = 11;

        when(leaderBoardRepository.getScore(userId, weekYear, weekNumber)).thenReturn(0);

        int result = leaderBoardServiceImplementation.getUserScore(userId, weekYear, weekNumber);

        assertEquals(0, result);

    }

    // ===================== getUserRank =====================

    @Test
    public void testGetUserRank_ReturnsRank() throws Exception { // OK

        String userId = "Ninja_Poliglota";
        int weekYear = 2024;
        int weekNumber = 11;

        when(leaderBoardRepository.getRank(userId, weekYear, weekNumber)).thenReturn(1L);

        long result = leaderBoardServiceImplementation.getUserRank(userId, weekYear, weekNumber);

        assertEquals(1L, result);
        verify(leaderBoardRepository, times(1)).getRank(userId, weekYear, weekNumber);

    }

    @Test
    public void testGetUserRank_ReturnsLastPosition() throws Exception { // OK

        String userId = "Ninja_Poliglota";
        int weekYear = 2024;
        int weekNumber = 11;

        when(leaderBoardRepository.getRank(userId, weekYear, weekNumber)).thenReturn(100L);

        long result = leaderBoardServiceImplementation.getUserRank(userId, weekYear, weekNumber);

        assertEquals(100L, result);

    }

}
