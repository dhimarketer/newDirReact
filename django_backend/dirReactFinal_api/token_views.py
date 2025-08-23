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
            
            response_data = {
                'access_token': access_token,
                'user': {
                    'id': token['user_id'],
                    'username': token['username'],
                    'user_type': token['user_type'],
                    'email': token['email'],
                    'score': token['score'],
                    'status': token['status']
                }
            }
            
            return Response(response_data, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
