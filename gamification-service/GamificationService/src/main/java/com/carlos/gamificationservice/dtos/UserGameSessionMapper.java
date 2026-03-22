package com.carlos.gamificationservice.dtos;

import com.carlos.gamificationservice.dtos.dtosImpl.UserGameSessionDTO;
import com.carlos.gamificationservice.models.UserGameSession;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface UserGameSessionMapper {
    UserGameSession toUserGameSession (UserGameSessionDTO userGameSessionDTO);
}
