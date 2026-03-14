package com.carlos.gamificationservice.services;

import com.carlos.gamificationservice.dtos.dtosImpl.UserGameSessionDTO;
import com.carlos.gamificationservice.models.UserGameSession;

import java.time.LocalDate;
import java.util.List;

public interface UserGameSessionService {

    boolean saveUserGameSession(UserGameSessionDTO newUserGameSession);
    boolean deleteAllUserGameSessions(String userName);
    boolean deleteAllUserGameSessionsPerDate(String userName, LocalDate intendedDate);

    List<UserGameSession> getAllUserGameSessions(String userName);
    List<UserGameSession> getAllUserGameSessionsPerDate(String userName, LocalDate intendedDate);
    List<UserGameSession> getAllUserGameSessionsPerPoints(String userName, Integer intendedPoints);

}
