package com.trd.service.impl;

import com.trd.dto.AuthResponse;
import com.trd.dto.LoginRequest;
import com.trd.dto.RegisterRequest;
import com.trd.dto.UserResponse;
import com.trd.entity.Role;
import com.trd.entity.User;
import com.trd.exception.BadRequestException;
import com.trd.repository.RoleRepository;
import com.trd.repository.UserRepository;
import com.trd.security.JwtTokenProvider;
import com.trd.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;
    private final AuthenticationManager authenticationManager;

    @Override
    @Transactional
    public AuthResponse login(LoginRequest request) {
        String identifier = request.getUsername().trim();
        Authentication authentication = authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(identifier, request.getPassword())
        );
        
        SecurityContextHolder.getContext().setAuthentication(authentication);
        String token = tokenProvider.generateToken(authentication);
        
        User user = findUserByIdentifier(identifier);
        
        return new AuthResponse(token, mapToUserResponse(user));
    }

    @Override
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new BadRequestException("Username is already taken");
        }
        
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email is already in use");
        }
        
        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setFullName(request.getFullName());
        
        Set<Role> roles = new HashSet<>();
        Role userRole = roleRepository.findByName(Role.RoleName.USER)
            .orElseGet(() -> {
                Role role = new Role();
                role.setName(Role.RoleName.USER);
                return roleRepository.save(role);
            });
        roles.add(userRole);
        user.setRoles(roles);
        
        User savedUser = userRepository.save(user);
        
        String token = tokenProvider.generateToken(savedUser.getUsername());
        
        return new AuthResponse(token, mapToUserResponse(savedUser));
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse getCurrentUser(String username) {
        User user = findUserByIdentifier(username);
        return mapToUserResponse(user);
    }

    private User findUserByIdentifier(String identifier) {
        return userRepository.findByUsername(identifier)
            .or(() -> userRepository.findByEmail(identifier))
            .orElseThrow(() -> new BadRequestException("User not found"));
    }
    
    private UserResponse mapToUserResponse(User user) {
        UserResponse response = new UserResponse();
        response.setId(user.getId());
        response.setUsername(user.getUsername());
        response.setEmail(user.getEmail());
        response.setFullName(user.getFullName());
        response.setBalance(user.getBalance());
        response.setCreatedAt(user.getCreatedAt());
        response.setRoles(user.getRoles().stream()
            .map(role -> role.getName().name())
            .collect(Collectors.toSet()));
        return response;
    }
}
