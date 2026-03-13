package com.carlos.gamificationservice.services;

import com.carlos.gamificationservice.dtos.UserStreakMapper;
import com.carlos.gamificationservice.dtos.dtosImpl.UserStreakDTO;
import com.carlos.gamificationservice.models.UserStreak;
import com.carlos.gamificationservice.repository.UserStreakRepository;
import com.carlos.gamificationservice.services.servicesImpl.UserStreakServiceImplementation;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.when;

// KEY TAKEAWAY
// @ExtendWith(MockitoExtension.class) --> better for unit tests since it processes simple mocking annotations.
// @ExtendWith(SpringExtension.class) --> better for integration tests since it loads the full application context.
@ExtendWith(MockitoExtension.class)
public class UserStreakServiceTest {

    @Mock
    private UserStreakRepository userStreakRepository;

    @Mock
    private UserStreakMapper userStreakMapper;

    @InjectMocks
    private UserStreakServiceImplementation userStreakServiceImplementation;

    // userStreakRepository.getUserStreakByUserName(userName);
    // userStreakRepository.save(newUserActivity);
    // userStreakRepository.save(currentUserStreak);
    // userStreakMapper.toUserStreakDTO(userStreakRepository.getUserStreakByUserName(userName));

    @Test
    public void testRegisterUserActivity1() throws Exception {

        LocalDate today = LocalDate.now();

        UserStreak newUserActivity = new UserStreak(1L,"Ninja_Poliglota", 1, 1, today);
        UserStreakDTO userStreakDTO = new UserStreakDTO(1,1);

        when(userStreakRepository.getUserStreakByUserName("Ninja_Poliglota"))
                .thenReturn(null)
                .thenReturn(newUserActivity);

        when(userStreakMapper.toUserStreakDTO(newUserActivity)).thenReturn(userStreakDTO);

        UserStreakDTO result = userStreakServiceImplementation.registerUserActivity("Ninja_Poliglota");

        assertEquals(1, result.getCurrentStreak());
        assertEquals(1, result.getLongestStreak());

    }

    @Test
    public void testRegisterUserActivity2() throws Exception {

        LocalDate lastDayOfActivity = LocalDate.now().minusDays(1);

        UserStreak currentUserActivity = new UserStreak(1L,"Ninja_Poliglota", 1, 1, lastDayOfActivity);
        UserStreakDTO userStreakDTO = new UserStreakDTO(1,2);

        when(userStreakRepository.getUserStreakByUserName("Ninja_Poliglota"))
                .thenReturn(currentUserActivity);
        //.thenReturn(newUserActivity);

        // when(userStreakMapper.toUserStreakDTO(newUserActivity)).thenReturn(userStreakDTO);

        // Mockito handles this bi itself, hence we don't need to mock this kind of methods were nothing is returned.
        //doNothing().when(userStreakRepository).save(newUserActivity);/**/

        UserStreakDTO result = userStreakServiceImplementation.registerUserActivity("Ninja_Poliglota");

        assertEquals(1, result.getCurrentStreak());
        assertEquals(1, result.getLongestStreak());

        /*  LocalDate today = LocalDate.now();

        UserStreak currentUserStreak = userStreakRepository.getUserStreakByUserName(userName);

        if (currentUserStreak == null) {
            // tested
        } else {
            long daysBetween = ChronoUnit.DAYS.between(currentUserStreak.getLastDateOfActivity(), today);

            if (daysBetween == 1) {
                int currentStreak = currentUserStreak.getCurrentStreak();
                currentUserStreak.setCurrentStreak(currentStreak + 1);
                currentUserStreak.setLastDateOfActivity(today);
                if ((currentStreak + 1) > currentUserStreak.getLongestStreak()) {
                    currentUserStreak.setLongestStreak(currentStreak + 1);
                }
            } else if (daysBetween > 1) {
                currentUserStreak.setCurrentStreak(1);
                currentUserStreak.setLastDateOfActivity(today);
            }

            userStreakRepository.save(currentUserStreak);
        }

        return userStreakMapper.toUserStreakDTO(userStreakRepository.getUserStreakByUserName(userName));

        */
    }

}
