package com.carlos.gamificationservice.services.servicesImpl;

import com.carlos.gamificationservice.dtos.UserGameSessionMapper;
import com.carlos.gamificationservice.dtos.dtosImpl.BooleanDTO;
import com.carlos.gamificationservice.dtos.dtosImpl.UserGameSessionDTO;
import com.carlos.gamificationservice.models.UserGameSession;
import com.carlos.gamificationservice.repository.UserGameSessionRepository;
import com.carlos.gamificationservice.services.UserGameSessionService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class UserGameSessionServiceImplementation implements UserGameSessionService {

    private final UserGameSessionRepository userGameSessionRepository;
    private final UserGameSessionMapper userGameSessionMapper;

    @Override
    public UserGameSessionDTO saveUserGameSession(UserGameSessionDTO newUserGameSession) {

        UserGameSessionDTO result;

        try {
            UserGameSession userGameSession = userGameSessionMapper.toUserGameSession(newUserGameSession);
            userGameSessionRepository.save(userGameSession); // Saves new game session data into the database.
            result = newUserGameSession;
        } catch (Exception e) {
            e.printStackTrace();
            result = null;
        }

        return result;
    }

    @Override
    @Transactional
    public BooleanDTO deleteAllUserGameSessions(String userName) {
        BooleanDTO result = new BooleanDTO();

        try {
            userGameSessionRepository.deleteUserGameSessionsByUserName(userName);
            result.setStatus(true);
        } catch (Exception e) {
            e.printStackTrace();
            result.setStatus(false);
        }

        return result;
    }

    @Override
    @Transactional
    public BooleanDTO deleteAllUserGameSessionsPerDate(String userName, LocalDate intendedDate) {
        BooleanDTO result = new BooleanDTO();

        try {
            userGameSessionRepository.deleteByUserNameAndSessionDate(userName, intendedDate);
            result.setStatus(true);
        } catch (Exception e) {
            e.printStackTrace();
            result.setStatus(false);
        }

        return result;
    }

    @Override
    public List<UserGameSession> getAllUserGameSessions(String userName) {
        return userGameSessionRepository.getAllByUserName(userName);
    }

    @Override
    public List<UserGameSession> getAllUserGameSessionsPerDate(String userName, LocalDate intendedDate) {
        return userGameSessionRepository.getAllByUserNameAndSessionDate(userName, intendedDate);
    }

    @Override
    public List<UserGameSession> getAllUserGameSessionsPerPoints(String userName, Integer intendedPoints) {
        return userGameSessionRepository.getAllByUserNameAndPoints(userName, intendedPoints);
    }
}
