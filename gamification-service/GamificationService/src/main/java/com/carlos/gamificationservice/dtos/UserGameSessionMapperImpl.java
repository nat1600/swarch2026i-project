package com.carlos.gamificationservice.dtos;

import com.carlos.gamificationservice.dtos.dtosImpl.UserGameSessionDTO;
import com.carlos.gamificationservice.models.UserGameSession;
import org.springframework.stereotype.Component;

@Component
public class UserGameSessionMapperImpl implements UserGameSessionMapper {

    @Override
    public UserGameSession toUserGameSession(UserGameSessionDTO userGameSessionDTO) {
        if (userGameSessionDTO == null) {
            return null;
        }

        UserGameSession userGameSession = new UserGameSession();

        userGameSession.setUserName(userGameSessionDTO.getUserName());
        userGameSession.setGamePlayed(userGameSessionDTO.getGamePlayed());
        userGameSession.setPoints(userGameSessionDTO.getPoints());
        userGameSession.setSessionDate(userGameSessionDTO.getSessionDate());

        return userGameSession;
    }
}
