package com.carlos.gamificationservice.services.servicesImpl;

import com.carlos.gamificationservice.dtos.dtosImpl.UserGameSessionDTO;
import com.carlos.gamificationservice.models.UserGameSession;
import com.carlos.gamificationservice.repository.UserGameSessionRepository;
import com.carlos.gamificationservice.services.UserGameSessionService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class UserGameSessionServiceImplementation implements UserGameSessionService {

    private final UserGameSessionRepository userGameSessionRepository;

    @Override
    public boolean saveUserGameSession(UserGameSessionDTO newUserGameSession) {
        return false;
    }

    @Override
    public boolean deleteAllUserGameSessions(String userName) {
        return false;
    }

    @Override
    public boolean deleteAllUserGameSessionsPerDate(String userName, LocalDate intendedDate) {
        return false;
    }

    @Override
    public List<UserGameSession> getAllUserGameSessions(String userName) {
        return List.of();
    }

    @Override
    public List<UserGameSession> getAllUserGameSessionsPerDate(String userName, LocalDate intendedDate) {
        return List.of();
    }

    @Override
    public List<UserGameSession> getAllUserGameSessionsPerPoints(String userName, Integer intendedPoints) {
        return List.of();
    }
}
