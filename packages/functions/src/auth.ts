import {
  Organizations,
  Info as OrganizationInfo,
} from '@unbind/core/organizations';
import { Users, Info } from '@unbind/core/users';
import { Config } from 'sst/node/config';
import {
  AuthHandler,
  // FacebookAdapter,
  GoogleAdapter,
  useSession,
} from 'sst/node/future/auth';

declare module 'sst/node/future/auth' {
  export interface SessionTypes {
    user: {
      userId: string;
      organizationId: string;
      name?: string;
      avatarUrl?: string;
    };
  }
}

export const handler = AuthHandler({
  clients: async () => ({
    // This allows local clients to redirect back to localhost
    local: 'http://localhost:3000',
  }),
  providers: {
    google: GoogleAdapter({
      mode: 'oidc',
      clientID: Config.GOOGLE_CLIENT_ID,
    }),
    // facebook: FacebookAdapter({
    //   clientID: Config.FACEBOOK_APP_ID,
    //   clientSecret: Config.FACEBOOK_APP_SECRET,
    //   scope: 'openid email',
    // }),
  },
  async onAuthorize() {
    // any code you want to run when auth begins
  },
  async onSuccess(input) {
    let userInDBParams:
      | Parameters<typeof Users.createThroughAuthProvider>[0]
      | null = null;
    let userInDB: Info;
    let orgInDB: OrganizationInfo;

    // Go through the different providers and workout the params
    if (input.provider === 'google' || input.provider === 'facebook') {
      const { sub, email, name, picture, given_name, family_name } =
        input.tokenset.claims();

      // Create the user through the Auth Provider, this should always return
      // a user. If the user already exists, it will return the existing user.
      userInDBParams = {
        authProvider: input.provider,
        authProviderId: sub,
        firstName: given_name || name?.split(' ')[0] || '',
        lastName: family_name || name?.split(' ')[1] || '',
        email: email || '',
        avatarUrl: picture,
      };
    }

    if (!userInDBParams) {
      throw new Error(
        `Unable to determine user details from provider ${input.provider}`
      );
    }

    const session = useSession();
    if (session.type === 'public') {
      // There is no current user that has been logged in, so we need to create
      // a new user.
      const res = await Organizations.createUserAndOrganization(userInDBParams);
      userInDB = res.user;
      orgInDB = res.organization;
    } else {
      // There is a current user that has been logged in, so we just need to
      // update or create this user's token and provider instead of creating a
      // new user.
      const res = await Organizations.addAuthProviderToUser({
        ...userInDBParams,
        userId: session.properties.userId,
      });

      userInDB = res.user;
      orgInDB = res.organizations[0];
    }

    return {
      type: 'user',
      properties: {
        userId: userInDB.userId,
        organizationId: orgInDB.organizationId,
        name: userInDB.fullName || userInDB.firstName,
        avatarUrl: userInDB.avatarUrl,
      },
    };
  },
  // This callback needs some work, not spec compliant currently
  async onError() {
    return {
      statusCode: 400,
      headers: {
        'Content-Type': 'text/plain',
      },
      body: 'Auth failed',
    };
  },
});
