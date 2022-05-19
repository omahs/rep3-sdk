//abi imports for mumbai network
import {
  deployed_address,
  deployed_address_polygon,
  networks_ENUM,
} from '../constants';
import forwarder_mumbai from '../contracts/abi/mumbai/minimalForwarder.json';
import pocp_mumbai from '../contracts/abi/mumbai/POCP.json';

class ContractManager {
  network: number;

  constructor(givenNetwork: number) {
    this.network = givenNetwork;
  }

  getAddress = () => {
    switch (this.network) {
      case networks_ENUM.MUMBAI:
        return {
          pocp: deployed_address.POCP_Proxy,
          forwarder: deployed_address.POCP_Forwarder,
        };
      case networks_ENUM.POLYGON:
        return {
          pocp: deployed_address_polygon.POCP_Proxy,
          forwarder: deployed_address_polygon.POCP_Forwarder,
        };
      default:
        return { pocp: 'not_deployed', forwarder: 'not_deployed' };
    }
  };

  getAbi = () => {
    switch (this.network) {
      case networks_ENUM.MUMBAI:
        return { pocp: pocp_mumbai.abi, forwarder: forwarder_mumbai.abi };
      case networks_ENUM.POLYGON:
        return { pocp: pocp_mumbai.abi, forwarder: forwarder_mumbai.abi };
      default:
        return { pocp: 'not_deployed', forwarder: 'not_deployed' };
    }
  };
}

export default ContractManager;
