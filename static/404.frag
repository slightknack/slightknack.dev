#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 u_resolution;
uniform float u_time;

float horizon(in vec2 uv) {
    return uv.y * 0.5 + 0.5;
}

float sun(in vec2 uv) {
    return length(vec2(
        sin(.5 * (uv.x + u_time * 0.1))/0.5 - 1.0,
        uv.y - sin(u_time * 0.1) * 0.7 + 0.2
    ));
}

vec3 color_sky(in vec2 uv) {
    float the_sun = sun(uv);
    float light = ((horizon(uv) - 0.4) / (the_sun*the_sun + 1.0)) / 0.5;
    return vec3(max(light, 1.0 - float(the_sun > 0.1)));
}


vec2 random2(vec2 st){
    st = vec2(dot(st,vec2(127.1,311.7)),
              dot(st,vec2(269.5,183.3)) );
    return -1.0 + 2.0*fract(sin(st)*43758.5453123);
}

// Gradient Noise by Inigo Quilez - iq/2013
// https://www.shadertoy.com/view/XdXGW8
float noise(vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);

    vec2 u = f*f*(3.0-2.0*f);

    return mix( mix( dot( random2(i + vec2(0.0,0.0) ), f - vec2(0.0,0.0) ),
                     dot( random2(i + vec2(1.0,0.0) ), f - vec2(1.0,0.0) ), u.x),
                mix( dot( random2(i + vec2(0.0,1.0) ), f - vec2(0.0,1.0) ),
                     dot( random2(i + vec2(1.0,1.0) ), f - vec2(1.0,1.0) ), u.x), u.y);
}

float stars(vec2 st) {
    vec3 color = vec3(.0);

    // Tile the space
    vec2 i_st = floor(st);
    vec2 f_st = fract(st);

    vec2 point = random2(i_st) * 0.4 + 0.5;
    vec2 diff = point - f_st;

    float dist = length(diff);

    // Draw cell center
    color += 1.-step(.02, dist);

    return color.r;
}

vec2 rotate(vec2 v, float a) {
	float s = sin(a);
	float c = cos(a);
	mat2 m = mat2(c, -s, s, c);
	return m * v;
}

float vonoroi(vec2 st) {
    vec3 color = vec3(.0);

    // Tile the space
    vec2 i_st = floor(st);
    vec2 f_st = fract(st);

    vec2 point = random2(i_st) * 0.4 + 0.5;
    vec2 diff = point - f_st;

    float m_dist = 1.1;

    for (int y= -2; y <= 2; y++) {
        for (int x= -2; x <= 2; x++) {
            // Neighbor place in the grid
            vec2 neighbor = vec2(float(x),float(y));
            vec2 point = random2(i_st + neighbor);
            point += noise(point + u_time * 0.05);
            vec2 diff = neighbor + point - f_st;
            float dist = length(diff);

            // Keep the closer distance
            m_dist = min(m_dist, dist);
        }
    }

    color += m_dist;

    return color.r;
}

void main() {
    vec2 uv = gl_FragCoord.xy/u_resolution.xy*2.0-1.0;
    uv.x*=u_resolution.x/u_resolution.y;

    float disp = noise(vec2(uv.x * 2. + sin(u_time * 0.5), sqrt(-uv.y * 400.0)));
    disp      += noise(vec2(uv.x * 1., -u_time + sqrt(-uv.y * 100.0)));
    if (uv.y < -0.1) {
        uv.y *= -1.;
        uv.y += disp * 0.5;
    }

    vec3 color = vec3(uv, 0.);
    color = color_sky(uv);
    color += stars(rotate((uv - vec2(0.5, 0.3)) * 3.0, u_time * 0.05)) * 0.6 * (-sin(u_time * 0.1)*0.5+0.5);

    color = vec3(mix(color.r, 1.0, float(1.-vonoroi(uv * 5.0) > (uv.y * uv.y * 5.0 - 0.1)) * 0.1));
    color = floor(color * 10.0) / 10.0;

    vec3 sun = vec3(1.0, 0.9, 0.5);
    vec3 sky = vec3(0.0, 0.5, 1.0);
    vec3 red = vec3(1.0, 0.0, 0.0);
    vec3 sea = vec3(0.0, 0.1, 0.3);
    vec3 a = mix(sea, sky, color.x);
    vec3 b = mix(sky, red, color.x);
    vec3 c = mix(red, sun, color.x);
    vec3 d = mix(a, b, color.x);
    color = mix(d, c, color.x);

    gl_FragColor = vec4(color, 1.0);
}
