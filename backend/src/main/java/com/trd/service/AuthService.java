package com.trd.service;

import com.trd.dto.AuthResponse;
import com.trd.dto.LoginRequest;
import com.trd.dto.RegisterRequest;
import com.trd.dto.UserResponse;

public interface AuthService {
    AuthResponse login(LoginRequest request);
    AuthResponse register(RegisterRequest request);
    UserResponse getCurrentUser(String username);
}
