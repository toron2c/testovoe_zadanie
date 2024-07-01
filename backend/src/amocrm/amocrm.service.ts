import { BadRequestException, Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class AmocrmService {
  private accessToken: string;
  private refreshToken: string;
  private refreshTimeout: NodeJS.Timeout;
  private readonly clientId = 'd4e0ed50-31e9-4f30-816d-141dc1b6be22';
  private readonly clientSecret =
    'ORg2m0vUqsypXAB2IT9IJZvcy59d4FQ79qSf5AcgmXyC3T96HwKhqUouJRUxSn0S';
  private readonly api = 'https://follik42.amocrm.ru/';
  private readonly redirectUri = 'http://localhost:3000/amocrm/callback';
  private readonly grantType = 'authorization_code';
  private readonly code =
    'def50200bb411a068ee005a3949328562a25113535e653b69299f29adb4832778fbfe4229886f84d7ea83ae1bf6625c942ea07786baec7526f6e59507d774b0ad19fc773e1cddb06c023cac689aff644b9ce03bedefa55b0d3fedcd0549ed7d8f24e5a3f225fe29dacad5fe8659b55b2a03e13ac8662b6d62c0986fb7f122abd53f11107e6975d4247250cdd12c8bccc59e80a5511fba021d2bacfdf705d211cee6d33fc6837c1d99c5a78bf90727aa60a1496d84bc9a53837967b2b89f3d447b4c9831640d4e2b826ac005fa09a394dd969ff0f43d94ccc5b35e130d6c9f9a89a34668efc5eacbf2c89cee6d9ce3ba97c3a04e7a15ac030f412f4dbc9c9fd9ccdc2356c9d3a9016aa8482158fdd9355d230c40040a4b54d2c4c8ab698a13d868a5492113e1757e02cc11cb4f8971f08e38070a66e939e64f7f67a0882c4074e837fd3493c95d17923ed13694507cd9a6a75c2120da115174dad8f98317464f5a25eccee9131482ad2af387e23260d429da50b3ae8ee77b27b95aa826f105dcd3d21e4da500541fe244961524a233edf16553eae6ee3b04196da4f990a66adb46d8ee6bfab5841c5cc3de6ad8d976fb63adaf641c87761dc4d3a8144ca7ad355dcb82c0c804e7cf7d889547d120d8f51f8a4d124c0bea19ed2eeb9960e1255cd65d91790f7fb04d5523a1921ccc3b494f8d8343ddcb2b86c';

  constructor() {}

  // init tokens
  async getTokens() {
    try {
      const response = await axios.post(`${this.api}oauth2/access_token`, {
        client_id: this.clientId,
        client_secret: this.clientSecret,
        grant_type: 'authorization_code',
        code: this.code,
        redirect_uri: 'http://localhost:3000/amocrm/callback',
      });

      //set tokens
      this.setTokens(response.data.access_token, response.data.refresh_token);

      //task updatetokens
      this.refreshTimeout = setTimeout(
        () => this.taskTokenRefresh(),
        (response.data.expires_in - 300) * 1000,
      );
    } catch (e) {
      console.log(e);
      throw new BadRequestException(
        'Возникла ошибка при инициализации токенов',
      );
    }
  }

  // gen tokens
  async genTokens() {
    try {
      const response = await axios.post(`${this.api}oauth2/access_token`, {
        client_id: this.clientId,
        client_secret: this.clientSecret,
        grant_type: 'refresh_token',
        refresh_token: this.refreshToken,
      });

      // set tokens
      this.setTokens(response.data.access_token, response.data.refresh_token);
      // task update tokens
      this.refreshTimeout = setTimeout(
        () => this.taskTokenRefresh(),
        (response.data.expires_in - 300) * 1000,
      );
    } catch (error) {
      console.log(error);
      throw new BadRequestException('Возникла ошибка при обновлении токенов');
    }
  }
  // get Token for query
  getAccessToken(): string {
    return this.accessToken;
  }
  async getLeads(query?: string) {
    try {
      const response = await axios.get(`${this.api}/api/v4/leads`, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
        params: {
          query: query ? query : '',
          with: 'contacts',
        },
      });
      if (response.data && response.data._embedded.leads) {
        const data = await Promise.all(
          response.data._embedded.leads.map(async (el, index) => {
            await this.delay(500 * index);
            return {
              id: el.id,
              name: el.name,
              price: el.price,
              responsible_user: await this.getResponsibleUser(
                el.responsible_user_id,
              ),
              created: el.created_by,
              status: el.status_id,
              pipeline: await this.getPipeline(el.pipeline_id, el.status_id),
              contacts: await this.getContacts(el._embedded.contacts),
            };
          }),
        );
        return data;
      } else {
        return [];
      }
    } catch (error) {
      console.log(error);
      throw new BadRequestException('Возникла ошибка при получении сделок');
    }
  }
  async getResponsibleUser(id: string) {
    try {
      const res = await axios.get(`${this.api}/api/v4/users/${id}`, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      });

      return res.data.name;
    } catch (error) {
      console.log(error);
      throw new BadRequestException(
        'Возникла ошибка при получении данных менеджера',
      );
    }
  }
  //get status voronki
  async getPipeline(pipelineId: string, statusId: string) {
    try {
      const res = await axios.get(
        `${this.api}/api/v4/leads/pipelines/${pipelineId}/statuses/${statusId}`,
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
        },
      );
      return {
        name: res.data.name,
        color: res.data.color,
      };
    } catch (error) {
      console.log(error);
      throw new BadRequestException(
        'Возникла ошибка при получении статуса сделки',
      );
    }
  }

  // get name contact
  async getContacts(contacts: any) {
    if (contacts) {
      const arr = await Promise.all(
        contacts.map(async (el) => await this.getContact(el.id)),
      );
      return arr;
    }
  }

  // get ContactField
  async getContact(id: string) {
    try {
      const res = await axios.get(`${this.api}/api/v4/contacts/${id}`, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      });
      if (res.data && res.data.custom_fields_values) {
        return {
          name: res.data.name,
          fields: res.data.custom_fields_values.map((el) => {
            return {
              link: el.field_code,
              value: el.values.map((el) => el.value),
            };
          }),
        };
      }
    } catch (error) {
      console.log(error);
      throw new BadRequestException(
        'Возникла ошибка при получении данных контакта',
      );
    }
  }
  // func create task for update tokenns
  private async taskTokenRefresh() {
    await this.genTokens();
  }

  // set tokens
  private setTokens(access_token: string, refresh_token: string) {
    this.accessToken = access_token;
    this.refreshToken = refresh_token;
  }
  // timeout
  private async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  // удаление таймера обновления токена
  onModuleDestroy() {
    if (this.refreshTimeout) {
      clearTimeout(this.refreshTimeout);
    }
  }
}
