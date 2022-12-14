//abi imports for mumbai network
import {
  deployed_address,
  deployed_address_polygon,
  networks_ENUM,
} from '../constants';

import mangerAbi from '../contracts/abi/manager/Manager.json';
import beaconAbi from '../contracts/abi/beacon/Beacon.json';
import proxyAbi from '../contracts/abi/proxy/Proxy.json';
import routerAbi from '../contracts/abi/router/Router.json';

class ContractManager {
  network: number;

  constructor(givenNetwork: number) {
    this.network = givenNetwork;
  }

  getAddress = () => {
    switch (this.network) {
      case networks_ENUM.MUMBAI:
        return {
          manager: deployed_address.Manager,
          beacon: deployed_address.Beacon,
          router: deployed_address.Router,
          trustedForwarder: '',
        };
      case networks_ENUM.POLYGON:
        return {
          manager: deployed_address_polygon.Manager,
          beacon: deployed_address_polygon.Beacon,
          router: deployed_address_polygon.Router,
          trustedForwarder: '',
        };
      default:
        return {
          manager: 'not_deployed',
          beacon: 'not_deployed',
          router: 'not_deployed',
          trustedForwarder: 'not_deployed',
        };
    }
  };

  getAbi = () => {
    switch (this.network) {
      case networks_ENUM.MUMBAI:
        return {
          manager: mangerAbi.abi,
          beacon: beaconAbi.abi,
          proxy: proxyAbi.abi,
          router: routerAbi.abi,
          trustedForwarder: 'not_deployed',
        };
      case networks_ENUM.POLYGON:
        return {
          manager: mangerAbi.abi,
          beacon: beaconAbi.abi,
          proxy: proxyAbi.abi,
          router: routerAbi.abi,
          trustedForwarder: 'not_deployed',
        };
      default:
        return {
          manager: mangerAbi.abi,
          beacon: beaconAbi.abi,
          proxy: proxyAbi.abi,
          router: routerAbi.abi,
          trustedForwarder: 'not_deployed',
        };
    }
  };
}

export default ContractManager;
