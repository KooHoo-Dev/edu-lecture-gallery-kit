// 예제: Scene 뷰에 반지름을 조절할 수 있는 원을 그린다 (gallery-kit 검사용)
using UnityEngine;

namespace KitExample.PulseCircle
{
    public class PulseCircle : MonoBehaviour
    {
        [SerializeField] float radius = 100f;
        [SerializeField] Color color = new Color(0.494f, 0.878f, 0.506f);

        void OnDrawGizmos()
        {
            Gizmos.color = color;
            Gizmos.DrawWireSphere(transform.position, radius / 100f);
        }
    }
}
