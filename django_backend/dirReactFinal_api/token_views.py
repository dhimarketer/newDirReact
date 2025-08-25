# 2025-01-27: Custom JWT token views for dirReactFinal migration project
# Extended token views with additional user information

from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework.response import Response
from rest_framework import status
from .serializers import UserSerializer

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Custom token serializer with additional user information"""
    
    def validate(self, attrs):
        # Get the default token data
        data = super().validate(attrs)
        
        # Add custom claims
        data['username'] = self.user.username
        data['user_type'] = self.user.user_type
        data['email'] = self.user.email
        data['score'] = self.user.score
        data['status'] = self.user.status
        data['is_staff'] = self.user.is_staff
        data['is_superuser'] = self.user.is_superuser
        data['first_name'] = self.user.first_name
        data['last_name'] = self.user.last_name
        
        return data

class CustomTokenObtainPairView(TokenObtainPairView):
    """Custom token obtain view with extended response"""
    serializer_class = CustomTokenObtainPairSerializer
    
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        
        if serializer.is_valid():
            # Get the validated data
            data = serializer.validated_data
            
            # Create response with user data
            response_data = {
                'access_token': data['access'],
                'refresh_token': data['refresh'],
                'user': {
                    'id': serializer.user.id,
                    'username': data['username'],
                    'email': data['email'],
                    'user_type': data['user_type'],
                    'score': data['score'],
                    'status': data['status'],
                    'is_staff': data['is_staff'],
                    'is_superuser': data['is_superuser'],
                    'first_name': data['first_name'],
                    'last_name': data['last_name']
                }
            }
            
            return Response(response_data, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class CustomTokenRefreshView(TokenRefreshView):
    """Custom token refresh view"""
    
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        
        if serializer.is_valid():
            # Get the new access token
            access_token = serializer.validated_data['access']
            
            # Decode token to get user information
            from rest_framework_simplejwt.tokens import AccessToken
            token = AccessToken(access_token)
            
            # Get user information from the database since custom claims aren't available in refreshed tokens
            from django.contrib.auth import get_user_model
            User = get_user_model()
            
            try:
                user = User.objects.get(id=token['user_id'])
                response_data = {
                    'access_token': access_token,
                    'user': {
                        'id': user.id,
                        'username': user.username,
                        'user_type': user.user_type,
                        'email': user.email,
                        'score': user.score,
                        'status': user.status,
                        'is_staff': user.is_staff,
                        'is_superuser': user.is_superuser,
                        'first_name': user.first_name,
                        'last_name': user.last_name
                    }
                }
            except User.DoesNotExist:
                # Fallback to basic token data if user not found
                response_data = {
                    'access_token': access_token,
                    'user': {
                        'id': token['user_id'],
                        'username': token.get('username', ''),
                        'user_type': token.get('user_type', ''),
                        'email': token.get('email', ''),
                        'score': token.get('score', 0),
                        'status': token.get('status', ''),
                        'is_staff': token.get('is_staff', False),
                        'is_superuser': token.get('is_superuser', False),
                        'first_name': token.get('first_name', ''),
                        'last_name': token.get('last_name', '')
                    }
                }
            
            return Response(response_data, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
