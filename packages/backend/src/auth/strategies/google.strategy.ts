import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback, Profile } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    config: ConfigService,
    private authService: AuthService,
  ) {
    super({
      clientID: config.get<string>('GOOGLE_CLIENT_ID') || 'GOOGLE_CLIENT_ID_NOT_CONFIGURED',
      clientSecret: config.get<string>('GOOGLE_CLIENT_SECRET') || 'GOOGLE_CLIENT_SECRET_NOT_CONFIGURED',
      callbackURL: config.get<string>(
        'GOOGLE_CALLBACK_URL',
        'http://localhost:3001/api/auth/google/callback',
      ),
      scope: ['email', 'profile'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): Promise<void> {
    const email = profile.emails?.[0]?.value;
    const firstName = profile.name?.givenName ?? profile.displayName?.split(' ')[0] ?? 'User';
    const lastName = profile.name?.familyName ?? profile.displayName?.split(' ').slice(1).join(' ') ?? '';
    const rawAvatarUrl = profile.photos?.[0]?.value ?? null;
    // Replace low-res suffix (e.g. =s96-c) with =s400-c for a higher-resolution photo
    const avatarUrl = rawAvatarUrl ? rawAvatarUrl.replace(/=s\d+-c$/, '=s400-c') : null;

    const result = await this.authService.googleLogin({
      googleId: profile.id,
      email: email ?? '',
      firstName,
      lastName,
      avatarUrl,
    });

    done(null, result);
  }
}
